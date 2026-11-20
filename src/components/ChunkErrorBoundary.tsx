import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** The failure fills one grid cell of the canvas instead of the whole window. */
  inline?: boolean;
}

/**
 * Catches a page whose code could not be downloaded, which happens when the app was redeployed while the tab stayed open (the old
 * file names are gone) or the connection dropped. Reloading gets the current version.
 */
export class ChunkErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('A page failed to load', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className={`${this.props.inline ? 'col-span-12 h-full' : 'h-screen w-screen'} flex flex-col items-center justify-center gap-3 bg-[#F1F0EC] text-[#0B0B0C] text-sm`}
      >
        <p>This page could not be loaded. The app may have been updated.</p>
        <button type="button" onClick={() => window.location.reload()} className="wb-btn h-9 px-4 text-[13px] focus-techm">
          Reload
        </button>
      </div>
    );
  }
}
