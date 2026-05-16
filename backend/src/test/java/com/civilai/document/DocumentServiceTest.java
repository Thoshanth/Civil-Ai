package com.civilai.document;

import com.civilai.storage.MinioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private MinioService minioService;

    @InjectMocks
    private DocumentService documentService;

    private UUID projectId;
    private UUID documentId;
    private DocumentEntity testDocument;
    private MultipartFile mockFile;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        documentId = UUID.randomUUID();
        
        testDocument = DocumentEntity.builder()
                .id(documentId)
                .projectId(projectId)
                .fileName("test.pdf")
                .minioKey("geotech/uuid_test.pdf")
                .fileType("application/pdf")
                .module("geotech")
                .fileSizeKb(1024)
                .build();

        mockFile = mock(MultipartFile.class);
    }

    @Test
    void uploadDocument_ShouldReturnSavedDocument() {
        // Arrange
        when(mockFile.getOriginalFilename()).thenReturn("test.pdf");
        when(mockFile.getContentType()).thenReturn("application/pdf");
        when(mockFile.getSize()).thenReturn(1024L * 1024);
        when(minioService.uploadFile(any(), anyString())).thenReturn("geotech/uuid_test.pdf");
        when(documentRepository.save(any(DocumentEntity.class))).thenReturn(testDocument);

        // Act
        DocumentEntity result = documentService.uploadDocument(projectId, "geotech", mockFile);

        // Assert
        assertNotNull(result);
        assertEquals("test.pdf", result.getFileName());
        assertEquals("geotech/uuid_test.pdf", result.getMinioKey());
        verify(minioService, times(1)).uploadFile(any(), eq("geotech"));
        verify(documentRepository, times(1)).save(any(DocumentEntity.class));
    }

    @Test
    void getProjectDocuments_ShouldReturnListOfDocuments() {
        // Arrange
        List<DocumentEntity> documents = Arrays.asList(testDocument);
        when(documentRepository.findByProjectIdOrderByUploadedAtDesc(projectId)).thenReturn(documents);

        // Act
        List<DocumentEntity> result = documentService.getProjectDocuments(projectId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testDocument.getFileName(), result.get(0).getFileName());
        verify(documentRepository, times(1)).findByProjectIdOrderByUploadedAtDesc(projectId);
    }

    @Test
    void getDocumentById_ShouldReturnDocument() {
        // Arrange
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

        // Act
        DocumentEntity result = documentService.getDocumentById(documentId);

        // Assert
        assertNotNull(result);
        assertEquals(documentId, result.getId());
        assertEquals("test.pdf", result.getFileName());
        verify(documentRepository, times(1)).findById(documentId);
    }

    @Test
    void getDocumentById_ShouldThrowException_WhenNotFound() {
        // Arrange
        when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> documentService.getDocumentById(documentId));
        verify(documentRepository, times(1)).findById(documentId);
    }

    @Test
    void getDownloadUrl_ShouldReturnPresignedUrl() {
        // Arrange
        String expectedUrl = "https://minio.example.com/presigned-url";
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
        when(minioService.getPresignedUrl(testDocument.getMinioKey())).thenReturn(expectedUrl);

        // Act
        String result = documentService.getDownloadUrl(documentId);

        // Assert
        assertEquals(expectedUrl, result);
        verify(documentRepository, times(1)).findById(documentId);
        verify(minioService, times(1)).getPresignedUrl(testDocument.getMinioKey());
    }

    @Test
    void deleteDocument_ShouldDeleteFromMinioAndDatabase() {
        // Arrange
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
        doNothing().when(minioService).deleteFile(anyString());
        doNothing().when(documentRepository).delete(any(DocumentEntity.class));

        // Act
        documentService.deleteDocument(documentId);

        // Assert
        verify(documentRepository, times(1)).findById(documentId);
        verify(minioService, times(1)).deleteFile(testDocument.getMinioKey());
        verify(documentRepository, times(1)).delete(testDocument);
    }
}
