package com.civilai.document;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentEntity> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId,
            @RequestParam("module") String module) {
        DocumentEntity document = documentService.uploadDocument(projectId, module, file);
        return ResponseEntity.ok(document);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DocumentEntity>> getProjectDocuments(
            @PathVariable UUID projectId) {
        List<DocumentEntity> documents = documentService.getProjectDocuments(projectId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentEntity> getDocument(@PathVariable UUID documentId) {
        DocumentEntity document = documentService.getDocumentById(documentId);
        return ResponseEntity.ok(document);
    }

    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable UUID documentId) {
        String url = documentService.getDownloadUrl(documentId);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
