import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { LogOut, Home, LogIn, Plus } from 'lucide-react';

/**
 * Housekeeping main tab content extracted from PMSModule.
 */
const HousekeepingTab = ({
  roomBlocks,
  roomStatusBoard,
  dueOutRooms,
  stayoverRooms,
  arrivalRooms,
  housekeepingTasks,
  quickUpdateRoomStatus,
  setOpenDialog,
  setSelectedRoom,
  setNewBooking,
  setMaintenanceForm,
  setMaintenanceDialogOpen,
  toast,
}) => {
  return (
    <TabsContent value="housekeeping" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Housekeeping Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setOpenDialog('hktask')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
          <Button onClick={() => setOpenDialog('roomblock')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Block Room
          </Button>
        </div>
      </div>

      {/* The rest of the content is still rendered inside PMSModule for now. */}
    </TabsContent>
  );
};

export default memo(HousekeepingTab);
