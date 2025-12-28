'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShareDialog from './share-dialog';

interface ShareButtonProps {
  tripId: string;
  shareCode: string;
  tripName: string;
  creatorName: string;
}

export default function ShareButton({ tripId, shareCode, tripName, creatorName }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">邀请</span>
      </Button>
      <ShareDialog
        tripId={tripId}
        shareCode={shareCode}
        tripName={tripName}
        creatorName={creatorName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
