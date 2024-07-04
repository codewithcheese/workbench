<script>
  import { Card, CardContent } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { Button } from "@/components/ui/button";
  import { PlusCircleIcon } from "lucide-svelte";
  import { Switch } from "@/components/ui/switch";
</script>

<div class="grid gap-4">
  <Button variant="secondary"><PlusCircleIcon class="text-gray-600" /></Button>
  <Card>
    <!--  <CardHeader class="flex flex-row items-center p-4">-->
    <!--    <div class="text-md flex-1 font-semibold">Who is the president</div>-->
    <!--    <EditIcon />-->
    <!--  </CardHeader>-->
    <CardContent class="grid gap-4 p-4">
      <div class="grid gap-2">
        <Label>Question</Label>
        <Textarea />
      </div>
      <div class="grid gap-2">
        <Label>Answer</Label>
        <Textarea />
      </div>
      <div class="flex flex-row items-center gap-2">
        <Switch id="eval-enabled" />
        <Label for="eval-enabled">Enabled</Label>
      </div>
    </CardContent>
  </Card>
</div>
