'use client';
import useDialogStore from '@/store/useDialogStore';
import { usePathname, useRouter } from 'next/navigation';
import { DIALOG_COMPONENTS } from '@/components/Dialog/core/DialogMap';

/**
 * 다이얼로그를 열기 위한 옵션 인터페이스
 * @interface IOpen<TProps>
 */
interface IOpen<TProps> {
  /**
   * 열고자 하는 다이얼로그의 이름
   * `DIALOG_COMPONENTS`에 정의된 키(key) 중 하나여야 함
   * @type {keyof typeof DIALOG_COMPONENTS}
   */
  dialogName: keyof typeof DIALOG_COMPONENTS;
  /**
   * 다이얼로그에 전달할 Props
   * `dialogProps.types.ts`에 정의된 Props 중 하나여야 함
   */
  dialogProps?: TProps;
  /**
   * 다이얼로그 외부를 클릭했을 때 다이얼로그가 닫히는 것을 막을지 여부
   * 기본값은 `false`
   * @type {boolean}
   * @default false
   */
  isBlockBackgroundClose?: boolean;
}

/**
 * 전역 다이얼로그 상태를 관리하고 제어하는 훅
 * URL의 해시(#)를 활용하여 뒤로가기/앞으로가기 버튼과 동기화하며 (앞으로 가기는 추후 구현)
 * 다이얼로그를 열거나 닫는 기능을 제공
 * @returns {{
 * dialogs: DialogState[],
 * isOpen: boolean,
 * isClosing: boolean,
 * open: ({ dialogName, dialogProps, isBlockBackgroundClose }: IOpen) => void,
 * close: () => void,
 * closeAll: () => void,
 * closeAllAndRoute: (url: string) => void
 * }}
 * - dialogs: 다이얼로그 히스토리를 추적하기 위한 배열
 * - isOpen: 다이얼로그가 열려있는지 여부
 * - isClosing: 다이얼로그가 닫히는 중인지 여부
 * - open: 특정 다이얼로그를 여는 함수
 * - close: 가장 최근에 열린 다이얼로그를 닫는 함수
 * - closeAll: 모든 다이얼로그를 닫는 함수
 * - closeAllAndRoute: 모든 다이얼로그를 닫고 페이지를 전환하는 함수
 */
const useDialog = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openDialog, closeDialog, closeAllDialog, dialogs, isOpen, isClosing } = useDialogStore();

  /**
   * 새로운 다이얼로그 열기
   * @param {IOpen} { dialogName, dialogProps, isBlockBackgroundClose } - 열고자 하는 다이얼로그의 이름과 Props 및 배경 클릭 닫기 차단 여부
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const open = ({ dialogName, dialogProps = undefined, isBlockBackgroundClose }: IOpen<any>) => {
    const cleanedPathname =
      pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    router.push(`${cleanedPathname}#dialog=${dialogName}`, { scroll: false });
    openDialog({
      dialogName,
      dialogContent: DIALOG_COMPONENTS[dialogName](dialogProps),
      isBlockBackgroundClose,
    });
  };

  /**
   * 가장 최근에 열린 다이얼로그를 닫고 URL 해시를 변경
   */
  const close = async () => {
    await closeDialog();
    router.back();
  };

  /**
   * 열려있는 모든 다이얼로그를 닫고, 히스토리를 초기 상태로 되돌림
   */
  const closeAll = async () => {
    const { dialogs: latestDialogs } = useDialogStore.getState();
    await closeAllDialog();
    window.history.go(-latestDialogs.length);
  };

  /**
   * 열려있는 모든 다이얼로그를 닫고, 히스토리를 초기 상태로 되돌린 후 url로 페이지 전환
   * @param {string} url - 이동할 페이지의 url
   */
  const closeAllAndRoute = (url: string) => {
    closeAll();
    setTimeout(() => {
      router.push(url);
    }, 500);
  };

  return { dialogs, isOpen, isClosing, open, close, closeAll, closeAllAndRoute };
};

export default useDialog;
