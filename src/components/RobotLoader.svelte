<script>
  import { cn } from "$lib/cn";

  let { class: className } = $$props;
</script>

<svg
  class={cn(`h-10 min-h-10 w-10 min-w-10 stroke-gray-700`, className)}
  viewBox="0 0 100 100"
  xmlns="http://www.w3.org/2000/svg"
>
  <style>
    @keyframes blink {
      0%,
      100% {
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
    }
    .eye {
      animation: blink 2s infinite;
    }
  </style>

  <!-- Robot head -->
  <rect class="icon" x="25" y="25" width="50" height="50" rx="10" />

  <!-- Eyes -->
  <circle class="eye icon" cx="40" cy="45" r="5" />
  <circle class="eye icon" cx="60" cy="45" r="5" />

  <!-- Antenna -->
  <line class="icon" x1="50" y1="25" x2="50" y2="15" />
  <circle class="icon" cx="50" cy="12" r="3" />
</svg>

<style>
  .icon {
    stroke-width: 2;
    fill: none;
  }
</style>
