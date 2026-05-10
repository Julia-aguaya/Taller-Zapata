import AuthenticatedCasesPreview from './AuthenticatedCasesPreview';
import AuthenticatedNotificationsPreview from './AuthenticatedNotificationsPreview';

export default function PanelGeneral({
  authenticatedCaseDetailState,
  authenticatedCasesState,
  authenticatedNotificationsState,
  authenticatedDocumentsCatalogsState,
  onOpenCase,
  onSaveDocument,
  onDownloadDocument,
  onPreviewDocument,
  isSavingDocuments,
  isDownloadingDocument,
  isPreviewingDocument,
  onMarkNotificationAsRead,
  onOpenAuthenticatedCaseDetail,
  onRefreshAuthenticatedCases,
  onRefreshAuthenticatedNotifications,
  pendingNotificationIds,
  notificationActionStateById,
  formatDate,
  formatDateTime,
}) {
  return (
    <div className="page-stack">
      <AuthenticatedCasesPreview
        detailState={authenticatedCaseDetailState}
        documentsCatalogs={authenticatedDocumentsCatalogsState.catalogs}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        isSavingDocuments={isSavingDocuments}
        isDownloadingDocument={isDownloadingDocument}
        isPreviewingDocument={isPreviewingDocument}
        onOpenCase={onOpenCase}
        onDownloadDocument={onDownloadDocument}
        onPreviewDocument={onPreviewDocument}
        onOpenDetail={onOpenAuthenticatedCaseDetail}
        onRefresh={onRefreshAuthenticatedCases}
        onSaveDocument={onSaveDocument}
        state={authenticatedCasesState}
      />

      <AuthenticatedNotificationsPreview
        formatDateTime={formatDateTime}
        itemActionStates={notificationActionStateById}
        pendingIds={pendingNotificationIds}
        state={authenticatedNotificationsState}
        onMarkAsRead={onMarkNotificationAsRead}
        onOpenCaseDetail={onOpenAuthenticatedCaseDetail}
        onRefresh={onRefreshAuthenticatedNotifications}
      />
    </div>
  );
}
