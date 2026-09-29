import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemsPanel } from "./items-panel";
import { RegionsPanel } from "./regions-panel";

const Settings = () => (
  <div className="space-y-6">
    <PageHeader
      title="地區與項目"
      description="油資以地區為單位設定「預設值」；安裝項目是工資價目表的基礎。"
    />

    <Tabs defaultValue="regions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="regions">地區與預設油資</TabsTrigger>
        <TabsTrigger value="items">安裝項目</TabsTrigger>
      </TabsList>
      <TabsContent value="regions" className="mt-0">
        <RegionsPanel />
      </TabsContent>
      <TabsContent value="items" className="mt-0">
        <ItemsPanel />
      </TabsContent>
    </Tabs>
  </div>
);

export default Settings;