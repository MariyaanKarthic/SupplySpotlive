import * as React from "react"
import { useState } from "react"
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Layout, Grid3x3, Rows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PageAlignmentProps {
  defaultAlignment?: 'left' | 'center' | 'right' | 'justify'
  defaultSpacing?: number
  defaultColumns?: number
  onAlignmentChange?: (alignment: string) => void
  onSpacingChange?: (spacing: number[]) => void
  onColumnsChange?: (columns: number) => void
}

const PageAlignment: React.FC<PageAlignmentProps> = ({
  defaultAlignment = 'left',
  defaultSpacing = 16,
  defaultColumns = 1,
  onAlignmentChange,
  onSpacingChange,
  onColumnsChange,
}) => {
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>(defaultAlignment);
  const [spacing, setSpacing] = useState(defaultSpacing);
  const [columns, setColumns] = useState(defaultColumns);
  const [activeTab, setActiveTab] = useState('alignment');

  const horizontalAlignments = [
    { id: 'left', value: 'left', label: 'Left', icon: <AlignLeft className="h-4 w-4" /> },
    { id: 'center', value: 'center', label: 'Center', icon: <AlignCenter className="h-4 w-4" /> },
    { id: 'right', value: 'right', label: 'Right', icon: <AlignRight className="h-4 w-4" /> },
    { id: 'justify', value: 'justify', label: 'Justify', icon: <AlignJustify className="h-4 w-4" /> },
  ];

  const layoutOptions = [
    { id: '1', value: '1', label: '1 Column', icon: <Layout className="h-4 w-4" /> },
    { id: '2', value: '2', label: '2 Columns', icon: <Grid3x3 className="h-4 w-4" /> },
    { id: '3', value: '3', label: '3 Columns', icon: <Grid3x3 className="h-4 w-4" /> },
    { id: '4', value: '4', label: '4 Columns', icon: <Grid3x3 className="h-4 w-4" /> },
  ];

  const handleAlignmentChange = (newAlignment: string) => {
    setAlignment(newAlignment as 'left' | 'center' | 'right' | 'justify');
    onAlignmentChange?.(newAlignment);
  };

  const handleSpacingChange = (newSpacing: number[]) => {
    setSpacing(newSpacing[0]);
    onSpacingChange?.(newSpacing);
  };

  const handleColumnsChange = (newColumns: string) => {
    const numColumns = parseInt(newColumns);
    setColumns(numColumns);
    onColumnsChange?.(numColumns);
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      case 'justify':
        return 'justify-between';
      default:
        return 'justify-start';
    }
  };

  const getGridColumns = () => {
    return `grid-cols-${columns}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Page Alignment</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alignment">Alignment</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="alignment" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Horizontal Alignment</Label>
                <div className="grid grid-cols-2 gap-2">
                  {horizontalAlignments.map((option) => (
                    <Button
                      key={option.id}
                      variant={alignment === option.value ? 'default' : 'outline'}
                      className="w-full justify-start gap-2"
                      onClick={() => handleAlignmentChange(option.value)}
                    >
                      {option.icon}
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Spacing</Label>
                  <Badge variant="secondary">{spacing}px</Badge>
                </div>
                <Slider
                  value={[spacing]}
                  onValueChange={handleSpacingChange}
                  min={0}
                  max={64}
                  step={4}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0px</span>
                  <span>64px</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Column Layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  {layoutOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={columns.toString() === option.value ? 'default' : 'outline'}
                      className="w-full justify-start gap-2"
                      onClick={() => handleColumnsChange(option.value)}
                    >
                      {option.icon}
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Actions</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      handleAlignmentChange('center');
                      handleColumnsChange('1');
                      handleSpacingChange([24]);
                    }}
                  >
                    <Layout className="h-4 w-4" />
                    <span className="text-xs">Centered Single Column</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      handleAlignmentChange('justify');
                      handleColumnsChange('3');
                      handleSpacingChange([16]);
                    }}
                  >
                    <Grid3x3 className="h-4 w-4" />
                    <span className="text-xs">Grid Layout</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview</Label>
              <Badge variant="outline" className="gap-1">
                <Rows className="h-3 w-3" />
                {columns} {columns === 1 ? 'Column' : 'Columns'}
              </Badge>
            </div>

            <div className="border border-border rounded-lg p-8 bg-muted/20 min-h-[400px]">
              <div
                className={`grid gap-${spacing / 4} ${
                  columns === 1
                    ? 'grid-cols-1'
                    : columns === 2
                    ? 'grid-cols-2'
                    : columns === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
                }`}
                style={{ gap: `${spacing}px` }}
              >
                {Array.from({ length: columns * 2 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${getAlignmentClass()}`}
                  >
                    <div className="bg-background border border-border rounded-md p-6 w-full">
                      <div className="space-y-3">
                        <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                <span>Content Block</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm border border-border"></div>
                <span>Container</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Current Configuration</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Alignment</div>
              <div className="flex items-center gap-2">
                {horizontalAlignments.find((a) => a.value === alignment)?.icon}
                <span className="text-sm font-medium capitalize">{alignment}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Spacing</div>
              <div className="text-sm font-medium">{spacing}px</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Columns</div>
              <div className="text-sm font-medium">{columns} Column{columns !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PageAlignment;
