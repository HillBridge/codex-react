import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOADING_DELAY_MS, Dialog } from "./Dialog";

describe("Dialog", () => {
  it("shows the close button only when requested and calls onClose", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog isOpen title="标题" onClose={onClose}>
        内容
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();

    rerender(
      <Dialog isOpen title="标题" onClose={onClose} showCloseButton>
        内容
      </Dialog>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Dialog with async content", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const ui = (props: { isOpen: boolean; isLoading: boolean; loadingDelay?: number }) => (
    <Dialog title="标题" onClose={vi.fn()} {...props}>
      {props.isLoading ? "加载中" : "内容"}
    </Dialog>
  );

  it("waits for the content and opens once with it when loading finishes in time", () => {
    vi.useFakeTimers();
    const { rerender } = render(ui({ isOpen: true, isLoading: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(DEFAULT_LOADING_DELAY_MS - 1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(ui({ isOpen: true, isLoading: false }));
    expect(screen.getByRole("dialog")).toHaveTextContent("内容");
    expect(screen.queryByText("加载中")).not.toBeInTheDocument();

    // 过了延迟也不会再有变化。
    act(() => vi.advanceTimersByTime(DEFAULT_LOADING_DELAY_MS * 2));
    expect(screen.getByRole("dialog")).toHaveTextContent("内容");
  });

  it("opens with the loading content after the delay, then swaps in the content", () => {
    vi.useFakeTimers();
    const { rerender } = render(ui({ isOpen: true, isLoading: true }));

    act(() => vi.advanceTimersByTime(DEFAULT_LOADING_DELAY_MS));
    expect(screen.getByRole("dialog")).toHaveTextContent("加载中");

    rerender(ui({ isOpen: true, isLoading: false }));
    expect(screen.getByRole("dialog")).toHaveTextContent("内容");
  });

  it("respects a custom delay", () => {
    vi.useFakeTimers();
    render(ui({ isOpen: true, isLoading: true, loadingDelay: 1000 }));

    act(() => vi.advanceTimersByTime(999));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays open if loading restarts after it was shown", () => {
    const { rerender } = render(ui({ isOpen: true, isLoading: false }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(ui({ isOpen: true, isLoading: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("starts a fresh wait on every open and never opens while closed", () => {
    vi.useFakeTimers();
    const { rerender } = render(ui({ isOpen: false, isLoading: true }));
    act(() => vi.advanceTimersByTime(DEFAULT_LOADING_DELAY_MS * 2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(ui({ isOpen: true, isLoading: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(DEFAULT_LOADING_DELAY_MS));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(ui({ isOpen: false, isLoading: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(ui({ isOpen: true, isLoading: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("behaves as before when isLoading is not used", () => {
    render(
      <Dialog isOpen title="标题" onClose={vi.fn()}>
        内容
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("内容");
  });
});
