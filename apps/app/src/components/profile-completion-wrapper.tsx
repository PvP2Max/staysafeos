"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfileCompletionModal } from "./profile-completion-modal";

interface ProfileCompletionData {
  isComplete: boolean;
  missingFields: string[];
  requiredFields: {
    rank: boolean;
    org: boolean;
    home: boolean;
  };
  account: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    rank?: string | null;
    unit?: string | null;
    homeAddress?: string | null;
    homeLat?: number | null;
    homeLng?: number | null;
  };
}

interface ProfileCompletionWrapperProps {
  children: React.ReactNode;
  initialData: ProfileCompletionData | null;
}

export function ProfileCompletionWrapper({
  children,
  initialData,
}: ProfileCompletionWrapperProps) {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileCompletionData | null>(initialData);
  const [showModal, setShowModal] = useState(!initialData?.isComplete);

  // Recheck profile completion when modal is completed
  const handleComplete = useCallback(async () => {
    try {
      const response = await fetch("/api/me/profile-completion");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        if (data.isComplete) {
          setShowModal(false);
          router.refresh();
        }
      }
    } catch {
      // If check fails, close modal and let them continue
      setShowModal(false);
    }
  }, [router]);

  // Update modal visibility when profileData changes
  useEffect(() => {
    if (profileData) {
      setShowModal(!profileData.isComplete);
    }
  }, [profileData]);

  return (
    <>
      {showModal && profileData && !profileData.isComplete && (
        <ProfileCompletionModal
          open={showModal}
          missingFields={profileData.missingFields}
          requiredFields={profileData.requiredFields}
          initialData={profileData.account}
          onComplete={handleComplete}
        />
      )}
      {children}
    </>
  );
}
