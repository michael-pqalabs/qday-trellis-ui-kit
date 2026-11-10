import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPreviewProvider } from "@/components/wallet-preview-provider";
import { CreateSessionDialog, PASSKEY_CONFIRM_MS } from "@/components/create-session-dialog";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("CreateSessionDialog", () => {
  const setup = (passActive = true) => {
    const onCreate = vi.fn();
    render(
      <WalletPreviewProvider>
        <CreateSessionDialog
          open
          onOpenChange={() => {}}
          agentName="Newsletter writer"
          passName="Shopping SignetPass"
          chainId="base"
          passActive={passActive}
          onCreate={onCreate}
        />
      </WalletPreviewProvider>,
    );
    return onCreate;
  };
  it("rejects a per-payment limit above the budget and does not create", () => {
    const onCreate = setup();
    fireEvent.change(screen.getByLabelText(/Per payment/), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: /Create session/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/can't exceed/);
    act(() => void vi.advanceTimersByTime(PASSKEY_CONFIRM_MS));
    expect(onCreate).not.toHaveBeenCalled();
  });
  it("rejects a duration above 30 days", () => {
    const onCreate = setup();
    fireEvent.change(screen.getByLabelText(/Duration/), { target: { value: "31" } });
    fireEvent.click(screen.getByRole("button", { name: /Create session/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/1 to 30/);
    expect(onCreate).not.toHaveBeenCalled();
  });
  it("creates with the typed limits after the simulated Passkey confirmation", () => {
    const onCreate = setup();
    fireEvent.change(screen.getByLabelText(/Total budget/), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: /Create session/ }));
    expect(screen.getByText("Simulating Passkey confirmation…")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(PASSKEY_CONFIRM_MS));
    expect(onCreate).toHaveBeenCalledWith(
      { perPaymentLimit: 5, totalBudget: 80, durationDays: 7 },
      "",
    );
  });
  it("passes the optional task summary along", () => {
    const onCreate = setup();
    fireEvent.change(screen.getByLabelText(/What is it for/), {
      target: { value: "  Buy a USB-C cable  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create session/ }));
    act(() => void vi.advanceTimersByTime(PASSKEY_CONFIRM_MS));
    expect(onCreate).toHaveBeenCalledWith(expect.anything(), "Buy a USB-C cable");
  });
  it("shows when the session ends, and nothing while the duration is invalid", () => {
    setup();
    const row = () => screen.getByText("Session ends").nextElementSibling!.textContent;
    expect(row()).not.toBe("—");
    fireEvent.change(screen.getByLabelText(/Duration/), { target: { value: "99" } });
    expect(row()).toBe("—");
  });
  it("names the agent's vendor and the blockchain", () => {
    render(
      <WalletPreviewProvider>
        <CreateSessionDialog
          open
          onOpenChange={() => {}}
          agentName="Newsletter writer"
          agentVendor="Claude Code · claude-opus-5-5"
          passName="Shopping SignetPass"
          chainId="base"
          passActive
          onCreate={() => {}}
        />
      </WalletPreviewProvider>,
    );
    expect(screen.getByText(/Claude Code · claude-opus-5-5 · Base/)).toBeTruthy();
  });
  it("blocks creation while the SignetPass is inactive", () => {
    setup(false);
    expect(
      (screen.getByRole("button", { name: /Create session/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
