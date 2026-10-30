import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";

export default function TabsDefaultDemo() {
  return (
    <Tabs defaultValue="story" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="story">Story</TabsTrigger>
        <TabsTrigger value="art">Art</TabsTrigger>
        <TabsTrigger value="letters">Letters</TabsTrigger>
      </TabsList>
      <TabsContent value="story">A courier races the rain across the rooftops.</TabsContent>
      <TabsContent value="art">Pencils done; inks on pages 1 to 11.</TabsContent>
      <TabsContent value="letters">Balloons placed, SFX still to come.</TabsContent>
    </Tabs>
  );
}
