import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPreviewProvider } from "@/components/wallet-preview-provider";
import { SERVER_CHECK_MS, SpendingLimitsEditor } from "@/components/spending-limits-editor";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const current = { perPaymentLimit: 10, totalBudget: 100, durationDays: 7 };
const setup = (currentSummary?: string) => {
  const onSave = vi.fn();
  render(
    <WalletPreviewProvider>
      <SpendingLimitsEditor
        current={current}
        {...(currentSummary === undefined ? {} : { currentSummary })}
        onSave={onSave}
        onDiscard={() => {}}
        chainId="base"
      />
    </WalletPreviewProvider>,
  );
  return onSave;
};

describe("SpendingLimitsEditor summary", () => {
  it("always has the optional summary field, even when the request had none", () => {
    setup();
    const field = screen.getByLabelText(/What is it for/) as HTMLInputElement;
    expect(field.value).toBe("");
  });
  it("starts from the request's summary", () => {
    setup("Book flights");
    expect((screen.getByLabelText(/What is it for/) as HTMLInputElement).value).toBe(
      "Book flights",
    );
  });
  it("saves an edited summary even when the limits stay the same", () => {
    const onSave = setup("Book flights");
    fireEvent.change(screen.getByLabelText(/What is it for/), {
      target: { value: " Book hotels " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save limits" }));
    act(() => void vi.advanceTimersByTime(SERVER_CHECK_MS));
    expect(onSave).toHaveBeenCalledWith(current, "Book hotels");
  });
  it("still reports no changes when nothing differs", () => {
    const onSave = setup("Book flights");
    fireEvent.click(screen.getByRole("button", { name: "Save limits" }));
    expect(screen.getByRole("status").textContent).toMatch(/No changes/);
    expect(onSave).not.toHaveBeenCalled();
  });
});
