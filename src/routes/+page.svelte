<script lang="ts">

    import {goto} from '$app/navigation';
    import {db} from '@/store.svelte';

    if (db.projects.items.length) {
      const project = db.projects.items[0];
      goto(`/project/${project.id}`);
    }

</script>
