import { useState } from "react";
import { useComputerStore } from "@mrgnlabs/fluxor-state";

/**
 * Hook for managing Mixin wallet connection state and interactions
 * Extracts common wallet connection logic used across pages
 */
export function useMixinWalletConnection() {
  const { user, connected } = useComputerStore((s) => ({
    user: s.user,
    connected: s.connected,
  }));

  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = !!user;

  /**
   * Opens login modal when user clicks connect button
   */
  const handleConnect = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    }
  };

  /**
   * Callback for when connection is successful
   * Can be extended per page if needed
   */
  const handleConnected = () => {
    // Future: Add any global connection success logic here
    // e.g., refreshUserData(), analytics tracking, etc.
  };

  /**
   * Closes the login modal
   */
  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return {
    // State
    user,
    connected,
    isLoggedIn,
    showLoginModal,

    // Actions
    handleConnect,
    handleConnected,
    handleCloseModal,
  };
}
