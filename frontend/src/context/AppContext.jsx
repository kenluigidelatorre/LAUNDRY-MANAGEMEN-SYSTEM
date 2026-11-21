
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  clearStoredToken,
  extractErrorMessage,
  getStoredToken,
  setStoredToken,
} from '../services/api';
import {
  authApi,
  bootstrapApi,
  customersApi,
  inventoryApi,
  notificationsApi,
  ordersApi,
  paymentsApi,
  servicesApi,
  settingsApi,
  staffApi,
} from '../services/laundryApi';

const EMPTY_SETTINGS = {
  businessName: "Wash n' Dash",
  contactNumber: '',
  address: '',
  email: '',
  currency: 'PHP',
  receiptHeader: '',
  receiptFooter: '',
  includeStaffOnReceipt: true,
  includePaymentBreakdown: true,
  autoLowStockAlerts: true,
};

const EMPTY_STORE = {
  orders: [],
  customers: [],
  services: [],
  staff: [],
  transactions: [],
  inventory: [],
  settings: EMPTY_SETTINGS,
};

export function getHomeRouteByRole(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'STAFF') return '/staff/dashboard';
  return '/customer/dashboard';
}

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getStoredToken()));
  const [dataLoading, setDataLoading] = useState(false);
  const [store, setStore] = useState(EMPTY_STORE);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Identifies the active session and invalidates outdated requests.
  const sessionVersionRef = useRef(0);

  const notify = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load database data only for the session that requested it.
  const hydrateFromDatabase = useCallback(async () => {
    const currentSession = sessionVersionRef.current;

    setDataLoading(true);

    try {
      const data = await bootstrapApi.loadAll();

      // Ignore results from an outdated session.
      if (currentSession !== sessionVersionRef.current) {
        return false;
      }

      setStore({
        orders: data.orders || [],
        customers: data.customers || [],
        services: data.services || [],
        staff: data.staff || [],
        transactions: data.transactions || [],
        inventory: data.inventory || [],
        settings: data.settings || EMPTY_SETTINGS,
      });

      setNotifications(data.notifications || []);

      return true;
    } catch (err) {
      // Ignore errors from an outdated session.
      if (currentSession !== sessionVersionRef.current) {
        return false;
      }

      notify(
        extractErrorMessage(
          err,
          "Unable to load Wash n' Dash database records."
        ),
        'error'
      );

      return false;
    } finally {
      // Only the current session can reset the loading state.
      if (currentSession === sessionVersionRef.current) {
        setDataLoading(false);
      }
    }
  }, [notify]);

  const logout = useCallback(() => {
    // Invalidate any database request still running.
    sessionVersionRef.current += 1;

    clearStoredToken();

    setUser(null);
    setStore(EMPTY_STORE);
    setNotifications([]);
    setDataLoading(false);
    setAuthLoading(false);
  }, []);

  // Handle expired or invalid authentication tokens.
  useEffect(() => {
    const handleUnauthorized = () => {
      // Invalidate requests from the expired session.
      sessionVersionRef.current += 1;

      setUser(null);
      setStore(EMPTY_STORE);
      setNotifications([]);
      setDataLoading(false);
      setAuthLoading(false);

      notify('Session expired. Please sign in again.', 'info');
    };

    window.addEventListener(
      'washndash:unauthorized',
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        'washndash:unauthorized',
        handleUnauthorized
      );
    };
  }, [notify]);

  // Restore the previous login session when the app starts.
  useEffect(() => {
    let active = true;
    const restoreSessionVersion = sessionVersionRef.current;

    const restoreSession = async () => {
      const token = getStoredToken();

      if (!token) {
        if (active) {
          setAuthLoading(false);
        }
        return;
      }

      try {
        const res = await authApi.me();

        if (
          !active ||
          restoreSessionVersion !== sessionVersionRef.current
        ) {
          return;
        }

        setUser(res.user);

        await hydrateFromDatabase();
      } catch {
        if (
          active &&
          restoreSessionVersion === sessionVersionRef.current
        ) {
          clearStoredToken();
          setUser(null);
          setStore(EMPTY_STORE);
          setNotifications([]);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [hydrateFromDatabase]);

  const login = useCallback(
    async (email, password, remember = true) => {
      const loginAttemptVersion = sessionVersionRef.current;

      try {
        const res = await authApi.login(email.trim(), password);

        // Do not allow a login request cancelled by logout
        // or another session change to restore authentication.
        if (loginAttemptVersion !== sessionVersionRef.current) {
          return {
            ok: false,
            error: 'Login was cancelled. Please try again.',
          };
        }

        // Start a new authenticated session.
        sessionVersionRef.current += 1;

        setStoredToken(res.token, remember);
        setUser(res.user);

        await hydrateFromDatabase();

        return {
          ok: true,
          user: res.user,
        };
      } catch (err) {
        return {
          ok: false,
          error: extractErrorMessage(
            err,
            'Invalid email address or password.'
          ),
        };
      }
    },
    [hydrateFromDatabase]
  );

  const registerCustomer = useCallback(
    async (payload) => {
      try {
        const res = await authApi.register(payload);
        if (res.user && res.user.role !== 'CUSTOMER') {
          clearStoredToken();
          return {
            ok: false,
            error:
              'Connected backend returned role "' +
              res.user.role +
              '" instead of "CUSTOMER". Please start the updated 3-role backend server from this package.',
          };
        }
        if (res.token && res.user) {
          sessionVersionRef.current += 1;
          setStoredToken(res.token, true);
          setUser(res.user);
          await hydrateFromDatabase();
        }

        return {
          ok: true,
          user: res.user,
          member: res.user,
        };
      } catch (err) {
        return {
          ok: false,
          error: extractErrorMessage(
            err,
            'Unable to register customer account.'
          ),
        };
      }
    },
    [hydrateFromDatabase]
  );

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    try {
      await notificationsApi.markRead(id);
    } catch {
      // Ignore non-critical read error.
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    try {
      await notificationsApi.markAllRead();
    } catch {
      // Ignore non-critical read error.
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const latest = await notificationsApi.list();
      setNotifications(latest || []);
    } catch {
      // Ignore notification refresh errors.
    }
  }, []);

  const refreshPortalData = useCallback(async () => {
    const currentSession = sessionVersionRef.current;
    try {
      const data = await bootstrapApi.loadAll();
      if (currentSession !== sessionVersionRef.current) return false;
      setStore({
        orders: data.orders || [],
        customers: data.customers || [],
        services: data.services || [],
        staff: data.staff || [],
        transactions: data.transactions || [],
        inventory: data.inventory || [],
        settings: data.settings || EMPTY_SETTINGS,
      });
      setNotifications(data.notifications || []);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const intervalSecs = Number(
      user.notificationPreferences?.autoRefreshSeconds ?? 15
    );
    const onFocus = () => {
      refreshPortalData();
    };
    window.addEventListener('focus', onFocus);

    let timer = null;
    if (intervalSecs > 0) {
      timer = setInterval(() => {
        refreshPortalData();
      }, Math.max(10, intervalSecs) * 1000);
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      if (timer) clearInterval(timer);
    };
  }, [user, refreshPortalData]);

  const createOrder = useCallback(
    async (input) => {
      try {
        const res = await ordersApi.create(input);
        const created = res.data;
        const txn = res.transaction;

        setStore((prev) => ({
          ...prev,
          orders: [created, ...prev.orders],
          transactions: txn
            ? [txn, ...prev.transactions]
            : prev.transactions,
        }));

        refreshNotifications();

        notify(
          `Order ${created.id} created for ${created.customerName}`
        );

        return created;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to create order.'),
          'error'
        );

        return null;
      }
    },
    [notify, refreshNotifications]
  );

  const updateOrder = useCallback(
    async (input) => {
      try {
        const updated = await ordersApi.update(input.id, input);

        setStore((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === updated.id ? updated : o
          ),
        }));

        notify(`Order ${updated.id} updated`);

        return true;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update order.'),
          'error'
        );

        return false;
      }
    },
    [notify]
  );

  const updateOrderStatus = useCallback(
    async (orderId, newStatus, remarks) => {
      try {
        const updated = await ordersApi.updateStatus(
          orderId,
          newStatus,
          remarks
        );

        setStore((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === updated.id ? updated : o
          ),
        }));

        refreshNotifications();

        notify(`Order ${orderId} updated to ${newStatus}`);

        return {
          ok: true,
          order: updated,
        };
      } catch (err) {
        const error = extractErrorMessage(
          err,
          'Could not update status.'
        );

        notify(error, 'error');

        return {
          ok: false,
          error,
        };
      }
    },
    [notify, refreshNotifications]
  );

  const assignStaffToOrder = useCallback(
    async (orderId, staffId, remarks) => {
      try {
        const updated = await ordersApi.assignStaff(
          orderId,
          staffId,
          remarks
        );

        setStore((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === updated.id ? updated : o
          ),
        }));

        notify(
          `Assigned ${orderId} to ${updated.assignedStaffName}`
        );

        return { ok: true };
      } catch (err) {
        const error = extractErrorMessage(
          err,
          'Unable to assign staff.'
        );

        notify(error, 'error');

        return {
          ok: false,
          error,
        };
      }
    },
    [notify]
  );

  const updateExpectedDate = useCallback(
    async (orderId, expectedCompletionDate) => {
      try {
        const updated = await ordersApi.updateExpectedDate(
          orderId,
          expectedCompletionDate
        );

        setStore((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === updated.id ? updated : o
          ),
        }));

        notify(
          `Updated expected completion date for ${orderId}`
        );

        return { ok: true };
      } catch (err) {
        const error = extractErrorMessage(
          err,
          'Unable to update expected completion date.'
        );

        notify(error, 'error');

        return {
          ok: false,
          error,
        };
      }
    },
    [notify]
  );

  const cancelOrder = useCallback(
    async (orderId, reason) => {
      try {
        const updated = await ordersApi.cancel(orderId, reason);

        setStore((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === updated.id ? updated : o
          ),
        }));

        notify(`Order ${orderId} cancelled`);

        return { ok: true };
      } catch (err) {
        const error = extractErrorMessage(
          err,
          'Unable to cancel order.'
        );

        notify(error, 'error');

        return {
          ok: false,
          error,
        };
      }
    },
    [notify]
  );

  const addCustomer = useCallback(
    async (data) => {
      try {
        const created = await customersApi.create(data);

        setStore((prev) => ({
          ...prev,
          customers: [created, ...prev.customers],
        }));

        notify(`Customer ${created.fullName} added`);

        return created;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to register customer.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateCustomer = useCallback(
    async (customer) => {
      try {
        const updated = await customersApi.update(
          customer.id,
          customer
        );

        setStore((prev) => ({
          ...prev,
          customers: prev.customers.map((c) =>
            c.id === updated.id ? updated : c
          ),
          orders: prev.orders.map((o) =>
            o.customerId === updated.id
              ? {
                  ...o,
                  customerName: updated.fullName,
                  contactNumber: updated.contactNumber,
                }
              : o
          ),
        }));

        notify(`Customer ${updated.fullName} updated`);

        return updated;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update customer.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const addService = useCallback(
    async (data) => {
      try {
        const item = await servicesApi.create(data);

        setStore((prev) => ({
          ...prev,
          services: [...prev.services, item],
        }));

        notify(`Service "${item.name}" added`);

        return item;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to add service.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateService = useCallback(
    async (service) => {
      try {
        const updated = await servicesApi.update(
          service.id,
          service
        );

        setStore((prev) => ({
          ...prev,
          services: prev.services.map((s) =>
            s.id === updated.id ? updated : s
          ),
        }));

        notify(`Service "${updated.name}" updated`);

        return updated;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update service.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const toggleServiceStatus = useCallback(
    async (serviceId) => {
      try {
        const updated = await servicesApi.toggleStatus(serviceId);

        setStore((prev) => ({
          ...prev,
          services: prev.services.map((s) =>
            s.id === updated.id ? updated : s
          ),
        }));

        notify('Service availability updated');
      } catch (err) {
        notify(
          extractErrorMessage(
            err,
            'Unable to toggle service status.'
          ),
          'error'
        );
      }
    },
    [notify]
  );

  const addStaff = useCallback(
    async (data) => {
      try {
        const member = await staffApi.create(data);

        setStore((prev) => ({
          ...prev,
          staff: [...prev.staff, member],
        }));

        notify(`Staff member ${member.fullName} added`);

        return member;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to create staff account.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateStaff = useCallback(
    async (member) => {
      try {
        const updated = await staffApi.update(
          member.id,
          member
        );

        setStore((prev) => ({
          ...prev,
          staff: prev.staff.map((s) =>
            s.id === updated.id ? updated : s
          ),
        }));

        notify(`${updated.fullName} updated`);

        return updated;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update staff account.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const toggleStaffStatus = useCallback(
    async (staffId) => {
      try {
        const updated = await staffApi.toggleStatus(staffId);

        setStore((prev) => ({
          ...prev,
          staff: prev.staff.map((s) =>
            s.id === updated.id ? updated : s
          ),
        }));

        notify('Staff account status updated');
      } catch (err) {
        notify(
          extractErrorMessage(
            err,
            'Unable to toggle staff status.'
          ),
          'error'
        );
      }
    },
    [notify]
  );

  const recordPayment = useCallback(
    async (input) => {
      try {
        const txn = await paymentsApi.record(input);

        const [freshOrders, freshTxns] = await Promise.all([
          ordersApi.list(),
          paymentsApi.list(),
        ]);

        setStore((prev) => ({
          ...prev,
          orders: freshOrders,
          transactions: freshTxns,
        }));

        refreshNotifications();

        notify(`Recorded payment for ${input.orderId}`);

        return {
          ok: true,
          transaction: txn,
        };
      } catch (err) {
        const error = extractErrorMessage(
          err,
          'Unable to record payment.'
        );

        notify(error, 'error');

        return {
          ok: false,
          error,
        };
      }
    },
    [notify, refreshNotifications]
  );

  const updateTransaction = useCallback(
    async (txn) => {
      try {
        const updated = await paymentsApi.update(
          txn.id,
          txn
        );

        setStore((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === updated.id ? updated : t
          ),
        }));

        notify(`Transaction ${updated.id} updated`);

        return updated;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update transaction.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const addInventoryItem = useCallback(
    async (data) => {
      try {
        const item = await inventoryApi.create(data);

        setStore((prev) => ({
          ...prev,
          inventory: [item, ...prev.inventory],
        }));

        notify(`Inventory item "${item.name}" added`);

        return item;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to add inventory item.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateInventoryItem = useCallback(
    async (item) => {
      try {
        const updated = await inventoryApi.update(
          item.id,
          item
        );

        setStore((prev) => ({
          ...prev,
          inventory: prev.inventory.map((i) =>
            i.id === updated.id ? updated : i
          ),
        }));

        notify(`Updated "${updated.name}"`);

        return updated;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update inventory item.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateInventoryStock = useCallback(
    async (itemId, deltaOrExact, mode = 'delta') => {
      try {
        const updated = await inventoryApi.updateStock(
          itemId,
          deltaOrExact,
          mode
        );

        setStore((prev) => ({
          ...prev,
          inventory: prev.inventory.map((i) =>
            i.id === updated.id ? updated : i
          ),
        }));

        notify('Stock level updated');
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update stock level.'),
          'error'
        );
      }
    },
    [notify]
  );

  const archiveInventoryItem = useCallback(
    async (itemId) => {
      try {
        await inventoryApi.archive(itemId);

        setStore((prev) => ({
          ...prev,
          inventory: prev.inventory.map((i) =>
            i.id === itemId
              ? { ...i, archived: true }
              : i
          ),
        }));

        notify('Inventory item archived');
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to archive inventory item.'),
          'error'
        );
      }
    },
    [notify]
  );

  const updateSettings = useCallback(
    async (next) => {
      try {
        const saved = await settingsApi.update(next);

        setStore((prev) => ({
          ...prev,
          settings: saved,
        }));

        notify("Wash n' Dash settings saved");

        return saved;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to save settings.'),
          'error'
        );

        return null;
      }
    },
    [notify]
  );

  const updateCurrentUserProfile = useCallback(
    async (patch) => {
      if (!user) return null;

      try {
        const res = await authApi.updateProfile(patch);
        const updatedUser = res.user;

        setUser(updatedUser);

        setStore((prev) => ({
          ...prev,
          staff: prev.staff.map((s) =>
            s.id === updatedUser.id
              ? {
                  ...s,
                  fullName: updatedUser.name,
                  email: updatedUser.email,
                  contactNumber: updatedUser.contactNumber,
                  shift: updatedUser.shift || s.shift,
                }
              : s
          ),
          customers: updatedUser.customerId
            ? prev.customers.map((c) =>
                c.id === updatedUser.customerId
                  ? {
                      ...c,
                      fullName: updatedUser.name,
                      email: updatedUser.email,
                      contactNumber: updatedUser.contactNumber,
                      address: updatedUser.address ?? c.address,
                    }
                  : c
              )
            : prev.customers,
        }));

        notify('Profile updated');

        return updatedUser;
      } catch (err) {
        notify(
          extractErrorMessage(err, 'Unable to update profile.'),
          'error'
        );

        return null;
      }
    },
    [user, notify]
  );

  const changeCurrentUserPassword = useCallback(
    async (payload) => {
      try {
        const res = await authApi.changePassword(payload);
        notify(res.message || 'Password updated successfully.');
        return { ok: true };
      } catch (err) {
        const msg = extractErrorMessage(err, 'Unable to change password.');
        notify(msg, 'error');
        return { ok: false, error: msg };
      }
    },
    [notify]
  );

  const updateNotificationPreferences = useCallback(
    async (prefs) => {
      try {
        const res = await authApi.updatePreferences(prefs);
        if (res.user) setUser(res.user);
        notify('Notification preferences saved.');
        return { ok: true, user: res.user };
      } catch (err) {
        const msg = extractErrorMessage(err, 'Unable to update preferences.');
        notify(msg, 'error');
        return { ok: false, error: msg };
      }
    },
    [notify]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        customerProfile:
          user?.role === 'CUSTOMER'
            ? store.customers.find((c) => c.id === user.customerId) || store.customers[0] || null
            : null,
        authLoading,
        dataLoading,
        login,
        registerCustomer,
        logout,
        refreshData: hydrateFromDatabase,
        refreshNotifications,
        refreshPortalData,
        changeCurrentUserPassword,
        updateNotificationPreferences,
        orders: store.orders,
        customers: store.customers,
        services: store.services,
        staff: store.staff,
        transactions: store.transactions,
        inventory: store.inventory,
        settings: store.settings,
        notifications,
        toasts,
        notify,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        createOrder,
        updateOrder,
        updateOrderStatus,
        assignStaffToOrder,
        updateExpectedDate,
        cancelOrder,
        addCustomer,
        updateCustomer,
        addService,
        updateService,
        toggleServiceStatus,
        addStaff,
        updateStaff,
        toggleStaffStatus,
        recordPayment,
        updateTransaction,
        addInventoryItem,
        updateInventoryItem,
        updateInventoryStock,
        archiveInventoryItem,
        updateSettings,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return ctx;
}
