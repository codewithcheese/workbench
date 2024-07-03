export type Store = {
  selected: {
    modelId: string | null;
  };
};

const storeJson = localStorage.getItem("store");

export let store: Store = $state(
  storeJson
    ? JSON.parse(storeJson)
    : {
        selected: {
          modelId: null,
        },
      },
);

// // persist store to localStorage
$effect.root(() => {
  $effect(() => {
    localStorage.setItem("store", JSON.stringify(store));
  });
});
