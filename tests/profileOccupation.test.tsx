/* @vitest-environment jsdom */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfileForm from "../components/ProfileForm";

// Mock next/router
vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ProfileForm occupation selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends occupationId on submit", async () => {
    const occupations = [
      { occupationId: "123", name: "Engineer" },
      { occupationId: "456", name: "Teacher" },
    ];

    const fetchMock = vi
      .fn()
      // First call for occupations
      .mockResolvedValueOnce({
        ok: true,
        json: async () => occupations,
      })
      // Second call for profile save
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    global.fetch = fetchMock as any;

    const { getByLabelText, getByText } = render(
      <ProfileForm initialProfile={null} />,
    );

    // Wait occupations loaded
    await waitFor(() => getByLabelText("Ocupación (ANZSCO Code)"));

    fireEvent.change(getByLabelText("Ocupación (ANZSCO Code)"), {
      target: { value: "456" },
    });

    fireEvent.change(getByLabelText("Edad"), { target: { value: "30" } });
    fireEvent.change(getByLabelText("Nivel de inglés"), {
      target: { value: "Competent" },
    });
    fireEvent.change(
      getByLabelText("Años experiencia fuera de Australia"),
      { target: { value: "5" } },
    );
    fireEvent.change(
      getByLabelText("Años experiencia en Australia"),
      { target: { value: "2" } },
    );
    fireEvent.change(getByLabelText("Educational qualifications"), {
      target: { value: "bachelor" },
    });
    fireEvent.change(
      getByLabelText("Australian study requirement met?"),
      { target: { value: "yes" } },
    );
    fireEvent.change(getByLabelText("Study in regional Australia?"), {
      target: { value: "no" },
    });
    fireEvent.change(
      getByLabelText("Professional Year in Australia?"),
      { target: { value: "no" } },
    );
    fireEvent.change(getByLabelText("Credentialed community language?"), {
      target: { value: "no" },
    });
    fireEvent.change(getByLabelText("Partner skills"), {
      target: { value: "single_or_au_partner" },
    });
    fireEvent.change(getByLabelText("Nomination or sponsorship"), {
      target: { value: "none" },
    });

    fireEvent.submit(getByText("Calcular"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/profile");
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent).toMatchObject({
      occupationId: "456",
      anzscoCode: "456",
    });
  });
});