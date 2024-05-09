<script lang="ts">
  import FilePond, { registerPlugin, supported } from "svelte-filepond";

  // a reference to the component, used to call FilePond methods
  let pond;

  // pond.getFiles() will return the active files

  // the name to use for the internal file input
  let name = "filepond";

  // handle filepond events
  function handleInit() {
    console.log("FilePond has initialised");
  }

  function handleAddFile(err: any, fileItem: any) {
    console.log("A file has been added", fileItem);
  }
</script>

<div class="app">
  <FilePond
    bind:this={pond}
    {name}
    server="/api"
    allowMultiple={true}
    oninit={handleInit}
    onaddfile={handleAddFile}
    credits="false"
  />
</div>
