import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import LandingPage from "./LandingPage";

vi.mock("../../components/LandingHeader/LandingHeader", () => ({ default: () => <div>landing-header</div> }));
vi.mock("../../seo/seo", () => ({ Seo: () => null }));

describe("LandingPage", () => {
    it("renders hero and navigates to catalog", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/clubs" element={<div>catalog page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/связист/i);
        await user.click(screen.getByRole("button", { name: /^секции с набором$/i }));
        expect(screen.getByText("catalog page")).toBeInTheDocument();
    });
});
