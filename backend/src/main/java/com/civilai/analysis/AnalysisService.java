package com.civilai.analysis;

import com.civilai.document.DocumentEntity;
import com.civilai.document.DocumentRepository;
import com.civilai.gateway.AiGatewayService;
import com.civilai.report.ReportEntity;
import com.civilai.report.ReportRepository;
import com.civilai.storage.MinioService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final AiGatewayService aiGateway;
    private final ReportRepository reportRepository;
    private final DocumentRepository documentRepository;
    private final MinioService minioService;
    private final ObjectMapper objectMapper;

    @Async
    @Transactional
    public void analyzeDocument(UUID documentId, String module) {
        log.info("Starting analysis for document: {} with module: {}", documentId, module);

        // Create PENDING report
        ReportEntity report = ReportEntity.builder()
                .documentId(documentId)
                .module(module)
                .status("PENDING")
                .build();
        report = reportRepository.save(report);

        try {
            // Get document and file from MinIO
            DocumentEntity doc = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));
            
            InputStream fileStream = minioService.downloadFile(doc.getMinioKey());
            byte[] fileBytes = fileStream.readAllBytes();

            // Map module to FastAPI endpoint
            String endpoint = getEndpointForModule(module);

            // Call FastAPI
            String result = aiGateway.analyzeWithFile(endpoint, fileBytes, doc.getFileName())
                    .block();

            // Parse LLM provider from response
            String llmUsed = extractLlmProvider(result);

            // Save SUCCESS report
            report.setStatus("SUCCESS");
            report.setResultJson(result);
            report.setLlmUsed(llmUsed);
            reportRepository.save(report);

            log.info("Analysis completed successfully for document: {}", documentId);

        } catch (Exception e) {
            log.error("Analysis failed for document: {}", documentId, e);
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            reportRepository.save(report);
        }
    }

    @Transactional
    public UUID analyzeWithJson(String module, Map<String, Object> requestData) {
        log.info("Starting JSON analysis for module: {}", module);

        // Create PENDING report
        ReportEntity report = ReportEntity.builder()
                .module(module)
                .status("PENDING")
                .build();
        report = reportRepository.save(report);

        UUID reportId = report.getId();

        // Async processing
        processJsonAnalysis(reportId, module, requestData);

        return reportId;
    }

    @Async
    @Transactional
    public void processJsonAnalysis(UUID reportId, String module, Map<String, Object> requestData) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        try {
            String endpoint = getEndpointForModule(module);
            String result = aiGateway.analyzeWithJson(endpoint, requestData).block();

            String llmUsed = extractLlmProvider(result);

            report.setStatus("SUCCESS");
            report.setResultJson(result);
            report.setLlmUsed(llmUsed);
            reportRepository.save(report);

            log.info("JSON analysis completed successfully for report: {}", reportId);

        } catch (Exception e) {
            log.error("JSON analysis failed for report: {}", reportId, e);
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            reportRepository.save(report);
        }
    }

    private String getEndpointForModule(String module) {
        return switch (module.toLowerCase()) {
            case "geotech" -> "/api/geotech/analyze";
            case "boq" -> "/api/boq/analyze";
            case "iscode" -> "/api/iscode/query";
            case "iscode-check", "iscode_check" -> "/api/iscode/check";
            case "structural" -> "/api/structural/calculate";
            case "tender" -> "/api/tender/analyze";
            case "site-photo", "site_photo" -> "/api/site_photo/analyze";
            default -> throw new IllegalArgumentException("Unknown module: " + module);
        };
    }
    
    /**
     * Search IS Codes
     */
    public Map<String, Object> searchIsCodes(String query, int limit) {
        log.info("Searching IS codes with query: {}", query);
        try {
            String result = aiGateway.analyzeWithJson(
                "/api/iscode/search?query=" + query + "&limit=" + limit,
                Map.of()
            ).block();
            return objectMapper.readValue(result, Map.class);
        } catch (Exception e) {
            log.error("IS code search failed", e);
            throw new RuntimeException("IS code search failed: " + e.getMessage());
        }
    }
    
    /**
     * List available IS Codes
     */
    public Map<String, Object> listAvailableCodes() {
        log.info("Listing available IS codes");
        try {
            String result = aiGateway.analyzeWithJson("/api/iscode/codes", Map.of()).block();
            return objectMapper.readValue(result, Map.class);
        } catch (Exception e) {
            log.error("Failed to list IS codes", e);
            throw new RuntimeException("Failed to list IS codes: " + e.getMessage());
        }
    }
    
    /**
     * Analyze BOQ with description (text-based)
     */
    public UUID analyzeBoqWithDescription(String description) {
        log.info("Starting BOQ analysis with description");
        
        ReportEntity report = ReportEntity.builder()
                .module("boq")
                .status("PENDING")
                .build();
        report = reportRepository.save(report);
        
        UUID reportId = report.getId();
        processBoqDescription(reportId, description);
        
        return reportId;
    }
    
    @Async
    @Transactional
    public void processBoqDescription(UUID reportId, String description) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        
        try {
            String result = aiGateway.analyzeWithFormData(
                "/api/boq/analyze",
                Map.of("description", description)
            ).block();
            
            String llmUsed = extractLlmProvider(result);
            
            report.setStatus("SUCCESS");
            report.setResultJson(result);
            report.setLlmUsed(llmUsed);
            reportRepository.save(report);
            
            log.info("BOQ description analysis completed successfully for report: {}", reportId);
            
        } catch (Exception e) {
            log.error("BOQ description analysis failed for report: {}", reportId, e);
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            reportRepository.save(report);
        }
    }

    private String extractLlmProvider(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (root.has("llm_provider")) {
                return root.get("llm_provider").asText();
            }
            return "Unknown";
        } catch (Exception e) {
            log.warn("Could not extract LLM provider from response", e);
            return "Unknown";
        }
    }
}
