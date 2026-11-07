import { useCallback, useRef, useState } from 'react';

export const useBatchFileUpload = ({ uploadFile, onCompleted }) => {
  const uploadingRef = useRef(false);
  const [state, setState] = useState({ isUploading: false, total: 0, completed: 0, failed: [] });

  const upload = useCallback(async (files) => {
    const filesToUpload = Array.from(files ?? []);
    if (uploadingRef.current || filesToUpload.length === 0) return;

    uploadingRef.current = true;
    setState({ isUploading: true, total: filesToUpload.length, completed: 0, failed: [] });
    const uploaded = [];
    const failed = [];

    for (const file of filesToUpload) {
      try {
        uploaded.push(await uploadFile(file));
      } catch (error) {
        failed.push({ file, error });
      } finally {
        setState((current) => ({ ...current, completed: current.completed + 1 }));
      }
    }

    uploadingRef.current = false;
    setState({ isUploading: false, total: filesToUpload.length, completed: filesToUpload.length, failed });
    await onCompleted?.({ uploaded, failed });
  }, [onCompleted, uploadFile]);

  const retryFailed = useCallback(() => upload(state.failed.map(({ file }) => file)), [state.failed, upload]);
  const clear = useCallback(() => setState({ isUploading: false, total: 0, completed: 0, failed: [] }), []);

  return { ...state, upload, retryFailed, clear };
};
