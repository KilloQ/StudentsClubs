import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import HomePage from "./HomePage";

const getClubsMock = vi.fn();
const getCategoriesMock = vi.fn();
const getWeatherMock = vi.fn();

vi.mock("../../api/clubs", () => ({
  getClubs: (...args: unknown[]) => getClubsMock(...args),
  getCategories: (...args: unknown[]) => getCategoriesMock(...args),
}));

vi.mock("../../api/external", () => ({
  getWeather: (...args: unknown[]) => getWeatherMock(...args),
}));

vi.mock("../../components/Navbar/Navbar", () => ({ default: () => <div>navbar</div> }));
vi.mock("../../components/ClubCard/ClubCard", () => ({
  default: ({ title, onClick }: { title: string; onClick: () => void }) => <button onClick={onClick}>{title}</button>,
}));
vi.mock("../../seo/seo", () => ({ Seo: () => null }));

describe("HomePage scenarios", () => {
  it("renders clubs and supports filtering/pagination controls", async () => {
    getCategoriesMock.mockResolvedValue(["Все", "Активные виды спорта"]);
    getWeatherMock.mockResolvedValue({ temp_c: 12, condition: "clear" });
    getClubsMock.mockResolvedValue({
      items: [{ id: 7, title: "Football", category: "Активные виды спорта", image_url: null }],
      total: 1,
      page: 1,
      page_size: 12,
    });

    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Routes>
          <Route path="/clubs" element={<HomePage />} />
          <Route path="/clubs/:clubId" element={<div>club details page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Football")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Football"));
    expect(await screen.findByText("club details page")).toBeInTheDocument();
  });

  it("shows error state on backend failure", async () => {
    getCategoriesMock.mockRejectedValue(new Error("categories down"));
    getWeatherMock.mockResolvedValue({ temp_c: 12, condition: "clear" });
    getClubsMock.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 12 });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/categories down/i)).toBeInTheDocument();
    });
  });
});
