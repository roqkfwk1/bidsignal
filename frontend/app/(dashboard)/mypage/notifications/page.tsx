'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/api/notifications';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { NotificationSettings } from '@/types/notice';

export default function NotificationsSettingsPage() {
  useRequireAuth();

  const [settings, setSettings]           = useState<NotificationSettings | null>(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    getNotificationSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  async function handleChange(key: keyof NotificationSettings, value: boolean) {
    if (!settings) return;
    const prev    = settings;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await updateNotificationSettings(updated);
    } catch {
      setSettings(prev);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <Link
          href="/mypage"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-base mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          마이페이지로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        <p className="text-gray-500 mt-1 text-base">마감 임박 공고 이메일 알림을 설정하세요.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 알림 채널 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <p className="px-6 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">알림 채널</p>
          <ToggleRow
            label="이메일 알림"
            subtitle="관심 공고 마감 임박 시 이메일로 알려드려요"
            checked={settings?.emailNotificationEnabled ?? false}
            onCheckedChange={(v) => handleChange('emailNotificationEnabled', v)}
            loading={loading}
          />
        </div>

        {/* 알림 시점 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <p className="px-6 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">알림 시점</p>
          <div className="divide-y divide-gray-100">
            <ToggleRow
              label="D-3 알림"
              subtitle="마감 3일 전에 알림을 받아요"
              checked={settings?.d3Enabled ?? false}
              onCheckedChange={(v) => handleChange('d3Enabled', v)}
              loading={loading}
            />
            <ToggleRow
              label="D-1 알림"
              subtitle="마감 1일 전에 알림을 받아요"
              checked={settings?.d1Enabled ?? false}
              onCheckedChange={(v) => handleChange('d1Enabled', v)}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  subtitle,
  checked,
  onCheckedChange,
  loading,
}: {
  label: string;
  subtitle: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-base font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-10" />
      ) : (
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      )}
    </div>
  );
}
