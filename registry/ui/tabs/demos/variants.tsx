import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";

export default function TabsVariantsDemo() {
  return (
    <div className="grid w-full max-w-sm gap-8">
      <Tabs defaultValue="art">
        <TabsList variant="line">
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="art">Art</TabsTrigger>
          <TabsTrigger value="letters" disabled>
            Letters
          </TabsTrigger>
        </TabsList>
        <TabsContent value="story">Line variant, first tab.</TabsContent>
        <TabsContent value="art">
          Line variant: a hand-drawn underline; one tab disabled.
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="inks" orientation="vertical">
        <TabsList>
          <TabsTrigger value="pencils">Pencils</TabsTrigger>
          <TabsTrigger value="inks">Inks</TabsTrigger>
          <TabsTrigger value="tones">Tones</TabsTrigger>
        </TabsList>
        <TabsContent value="pencils">Vertical, first tab.</TabsContent>
        <TabsContent value="inks">Vertical: the rule runs down the right side.</TabsContent>
        <TabsContent value="tones">Vertical, last tab.</TabsContent>
      </Tabs>
      <Tabs defaultValue="ch1" orientation="vertical">
        <TabsList variant="line">
          <TabsTrigger value="ch1">Chapter 1</TabsTrigger>
          <TabsTrigger value="ch2">Chapter 2</TabsTrigger>
        </TabsList>
        <TabsContent value="ch1">Vertical line variant.</TabsContent>
        <TabsContent value="ch2">Second chapter.</TabsContent>
      </Tabs>
    </div>
  );
}
