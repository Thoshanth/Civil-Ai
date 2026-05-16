package com.civilai.analysis;

import com.civilai.document.DocumentEntity;
import com.civilai.document.DocumentRepository;
import com.civilai.gateway.AiGatewayService;
import com.civilai.report.ReportEntity;
import com.civilai.report.ReportRepository;
import com.civilai.storage.MinioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalysisServiceTest {

    @Mock
    private AiGatewayService aiGateway;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private MinioService minioService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AnalysisService analysisService;

    private UUID documentId;
    private DocumentEntity testDocument;
    private ReportEntity testReport;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        
        testDocument = DocumentEntity.builder()
                .id(documentId)
                .projectId(UUID.randomUUID())
                .fileName("test.pdf")
                .minioKey("geotech/uuid_test.pdf")
                .fileType("application/pdf")
                .module("geotech")
                .build();

        testReport = ReportEntity.builder()
                .id(UUID.randomUUID())
                .documentId(documentId)
                .module("geotech")
                .status("PENDING")
                .build();
    }

    @Test
    void analyzeDocument_ShouldCreatePendingReport() {
        // Arrange
        when(reportRepository.save(any(ReportEntity.class))).thenReturn(testReport);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
        when(minioService.downloadFile(anyString())).thenReturn(new ByteArrayInputStream(new byte[0]));
        when(aiGateway.analyzeWithFile(anyString(), any(), anyString()))
                .thenReturn(Mono.just("{\"llm_provider\":\"Groq\"}"));

        // Act
        analysisService.analyzeDocument(documentId, "geotech");

        // Assert
        verify(reportRepository, atLeastOnce()).save(any(ReportEntity.class));
    }

    @Test
    void analyzeWithJson_ShouldReturnReportId() {
        // Arrange
        ReportEntity savedReport = ReportEntity.builder()
                .id(UUID.randomUUID())
                .module("structural")
                .status("PENDING")
                .build();
        
        when(reportRepository.save(any(ReportEntity.class))).thenReturn(savedReport);
        when(reportRepository.findById(any(UUID.class))).thenReturn(Optional.of(savedReport));
        when(aiGateway.analyzeWithJson(anyString(), any()))
                .thenReturn(Mono.just("{\"llm_provider\":\"Groq\"}"));

        // Act
        UUID result = analysisService.analyzeWithJson("structural", java.util.Map.of("test", "data"));

        // Assert
        assertNotNull(result);
        verify(reportRepository, atLeastOnce()).save(any(ReportEntity.class));
    }
}
