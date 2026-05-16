package com.civilai.document;

import com.civilai.storage.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final MinioService minioService;

    @Transactional
    public DocumentEntity uploadDocument(UUID projectId, String module, MultipartFile file) {
        // Upload to MinIO
        String minioKey = minioService.uploadFile(file, module);

        // Save metadata to database
        DocumentEntity document = DocumentEntity.builder()
                .projectId(projectId)
                .fileName(file.getOriginalFilename())
                .minioKey(minioKey)
                .fileType(file.getContentType())
                .module(module)
                .fileSizeKb((int) (file.getSize() / 1024))
                .build();

        return documentRepository.save(document);
    }

    public List<DocumentEntity> getProjectDocuments(UUID projectId) {
        return documentRepository.findByProjectIdOrderByUploadedAtDesc(projectId);
    }

    public DocumentEntity getDocumentById(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public String getDownloadUrl(UUID documentId) {
        DocumentEntity document = getDocumentById(documentId);
        return minioService.getPresignedUrl(document.getMinioKey());
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        DocumentEntity document = getDocumentById(documentId);
        minioService.deleteFile(document.getMinioKey());
        documentRepository.delete(document);
    }
}
