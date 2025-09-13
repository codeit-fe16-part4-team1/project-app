'use client';

import { DialogStore } from '@/types/dialog.types';
import { create } from 'zustand';

const OPEN_DIALOG_DELAY = 250;

/**
 * @description 다이얼로그 상태를 관리하는 Zustand 스토어
 * 이 스토어는 다이얼로그의 스택, 열림/닫힘 상태, 그리고 부드러운 전환 효과를 처리
 */
const useDialogStore = create<DialogStore>((set) => ({
  dialogs: [],
  isOpen: false,
  isClosing: false,

  setIsClosing: (isClosing) => set({ isClosing }),

  openDialog: ({ dialogName, dialogContent, isBlockBackgroundClose = false }) => {
    set((prev) => {
      const isFirstDialog = prev.dialogs.length === 0;

      if (!isFirstDialog) {
        setTimeout(() => {
          set((innerPrev) => ({
            dialogs: [
              ...innerPrev.dialogs,
              {
                dialogName,
                dialogContent,
                isBlockBackgroundClose,
              },
            ],
            isOpen: true,
            isBacking: false,
          }));
        }, OPEN_DIALOG_DELAY);

        return { isOpen: false };
      }

      return {
        dialogs: [
          ...prev.dialogs,
          {
            dialogName,
            dialogContent,
            isBlockBackgroundClose,
          },
        ],
        isOpen: true,
        isBacking: false,
      };
    });
  },

  closeDialog: () => {
    return new Promise<void>((resolve) => {
      set(() => ({
        isOpen: false,
        isClosing: true,
      }));

      setTimeout(() => {
        set((prev) => {
          const hasDialogs = prev.dialogs.length > 1;
          return { dialogs: prev.dialogs.slice(0, -1), isOpen: hasDialogs, isClosing: false };
        });
        resolve();
      }, OPEN_DIALOG_DELAY);
    });
  },

  closeAllDialog: () => {
    return new Promise<void>((resolve) => {
      set(() => ({
        isOpen: false,
        isClosing: true,
      }));

      setTimeout(() => {
        set(() => {
          return {
            dialogs: [],
            isOpen: false,
            isClosing: false,
          };
        });
        resolve();
      }, OPEN_DIALOG_DELAY);
    });
  },
}));

export default useDialogStore;
