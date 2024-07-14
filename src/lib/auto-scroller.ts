import type { Action } from "svelte/action";

export class AutoScroller {
  private node: HTMLElement | null = null;
  private userHasScrolled = false;
  private lastScrollTop = 0;

  constructor(private scrollImmediate = false) {}

  private handleScroll = () => {
    if (!this.node) return;
    if (
      this.node.scrollHeight > this.node.clientHeight &&
      this.node.scrollTop < this.lastScrollTop
    ) {
      this.userHasScrolled = true;
    } else if (this.node.scrollHeight - this.node.scrollTop === this.node.clientHeight) {
      this.userHasScrolled = false;
    }
    this.lastScrollTop = this.node.scrollTop;
  };

  private scrollToBottom() {
    if (this.node && !this.userHasScrolled) {
      this.node.scrollTop = this.node.scrollHeight;
    }
  }

  public action: Action<HTMLElement> = (node) => {
    this.node = node;
    this.node.addEventListener("scroll", this.handleScroll);
    if (this.scrollImmediate) {
      this.scrollToBottom();
    }

    return {
      destroy: () => {
        this.node?.removeEventListener("scroll", this.handleScroll);
        this.node = null;
      },
    };
  };

  public onLoading = () => {
    this.userHasScrolled = false;
    this.scrollToBottom();
  };
  public onMessageUpdate = () => this.scrollToBottom();
}
