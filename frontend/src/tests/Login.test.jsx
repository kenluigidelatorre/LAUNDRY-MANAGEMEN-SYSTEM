import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Login } from "../pages/auth/Login";

vi.mock("../context/AppContext", () => ({
  useApp: () => ({
    user: null,
    login: vi.fn(),
    registerCustomer: vi.fn(),
    notify: vi.fn(),
  }),
  getHomeRouteByRole: vi.fn(() => "/"),
}));

describe("Login Page", () => {
  it("renders the login form correctly", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Gmail \/ Email Address/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    const signInButtons = screen.getAllByRole("button", {
      name: "Sign In",
    });

    expect(signInButtons[1]).toHaveAttribute("type", "submit");
  });
});
