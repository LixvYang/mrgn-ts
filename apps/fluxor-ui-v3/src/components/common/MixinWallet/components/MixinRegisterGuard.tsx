/**
 * Mixin 注册守卫组件
 * 检测用户状态并在需要时显示注册提示
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useComputerStore } from "@mrgnlabs/fluxor-state";
import { MixinRegisterPrompt } from "./MixinRegisterPrompt";
import { MixinRegisterModal } from "./MixinRegisterModal";

export function MixinRegisterGuard() {
  const { connected, register } = useComputerStore((s) => ({
    connected: s.connected,
    register: s.register,
  }));

  const [showPrompt, setShowPrompt] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 检测用户是否需要注册
  useEffect(() => {
    // 如果用户已登录 Mixin 但未注册金融云,显示提示
    const needsRegistration = connected && !register;

    if (needsRegistration) {
      // 检查用户是否已经看过提示 (避免重复打扰)
      const hasSeenPrompt = sessionStorage.getItem("hasSeenMixinRegisterPrompt");

      if (!hasSeenPrompt) {
        // 延迟 1 秒显示提示,避免立即打扰用户
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [connected, register]);

  const handleClosePrompt = useCallback(() => {
    setShowPrompt(false);
    // 记录用户已看过提示 (session 级别,刷新页面会重新提示)
    sessionStorage.setItem("hasSeenMixinRegisterPrompt", "true");
  }, []);

  const handleRegister = useCallback(() => {
    setShowPrompt(false);
    setShowRegisterModal(true);
    sessionStorage.setItem("hasSeenMixinRegisterPrompt", "true");
  }, []);

  const handleCloseRegisterModal = useCallback(() => {
    setShowRegisterModal(false);
  }, []);

  // 如果用户已注册,不显示任何提示
  if (!connected || register) {
    return null;
  }

  return (
    <>
      {/* 注册提示对话框 */}
      <MixinRegisterPrompt isOpen={showPrompt} onClose={handleClosePrompt} onRegister={handleRegister} />

      {/* 注册二维码对话框 */}
      <MixinRegisterModal isOpen={showRegisterModal} onClose={handleCloseRegisterModal} />
    </>
  );
}
