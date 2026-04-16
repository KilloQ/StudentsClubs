import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("../contexts/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderRoute(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("ProtectedRoute", () => {
  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({ loading: true, isAuthenticated: false, user: null });
    renderRoute(<ProtectedRoute><div>ok</div></ProtectedRoute>);
    expect(screen.getByText("Загрузка...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users", () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: false, user: null });
    renderRoute(<ProtectedRoute><div>ok</div></ProtectedRoute>);
    expect(screen.queryByText("ok")).not.toBeInTheDocument();
  });

  it("blocks non admin on admin route", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: "teacher", is_teacher: true },
    });
    renderRoute(<ProtectedRoute requireAdmin><div>admin-only</div></ProtectedRoute>);
    expect(screen.queryByText("admin-only")).not.toBeInTheDocument();
  });
});
