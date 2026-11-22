"use client";

import { DirectionProvider } from "@/registry/ui/direction/direction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";

export default function DirectionArabicTabsVariant() {
  return (
    // The tabs start at the right and the arrow keys follow; `<bdi>` keeps each English series
    // title in its own direction inside the Arabic sentence.
    <DirectionProvider direction="rtl">
      <div lang="ar" dir="rtl" className="w-full max-w-sm">
        <Tabs defaultValue="reading">
          <TabsList>
            <TabsTrigger value="reading">القراءة</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="downloads">التنزيلات</TabsTrigger>
          </TabsList>
          <TabsContent value="reading" className="leading-loose">
            تابع قراءة <bdi lang="en">Night Market</bdi> من الصفحة 3 في الفصل 12.
          </TabsContent>
          <TabsContent value="alerts" className="leading-loose">
            سنخبرك عند صدور فصل جديد من <bdi lang="en">Rooftop Courier</bdi>.
          </TabsContent>
          <TabsContent value="downloads" className="leading-loose">
            تم تنزيل ثلاثة مجلدات للقراءة دون اتصال.
          </TabsContent>
        </Tabs>
      </div>
    </DirectionProvider>
  );
}
