'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IDsPage from './ids/page';
import TestChat from './chat/page';
import { Card } from '@/components/ui/card';

const tests = [
  {
    id: 0,
    name: 'IDs',
    component: <IDsPage />,
  },
  {
    id: 1,
    name: 'Chat',
    component: <TestChat />,
  },
];

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<number>(0);

  const handleSelectTest = (test: number) => {
    setSelectedTest(test);
  };

  return (
    <Card className="flex flex-col size-full gap-2 p-2 bg-background">
      <Tabs defaultValue={tests[0].id.toString()} className="w-full">
        <TabsList className="w-full">
          {tests.map((test) => (
            <TabsTrigger
              key={test.id}
              value={test.id.toString()}
              onClick={() => handleSelectTest(test.id)}
              className="w-full text-center font-bold text-sm sm:text-lg"
            >
              {test.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value={selectedTest.toString()}
          className="flex flex-col size-full border rounded p-2"
        >
          {tests[selectedTest].component}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
