package com.civilai.analysis;

import com.civilai.document.DocumentService;
import com.civilai.gateway.AiGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analyze")
@RequiredArgsConstructor
@Slf4j
public class AnalysisController {

    private final AnalysisService analysisService;
    private final AiGatewayService aiGatewayService;
    private final DocumentService documentService;

    /**
     * Analyze geotechnical report
     * POST /api/analyze/geotech
     */
    @PostMapping("/geotech")
    public ResponseEntity<Map<String, Object>> analyzeGeotech(
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("Analyzing geotechnical report: {}", file.getOriginalFilename());
            
            // Call AI Gateway directly
            String result = aiGatewayService.analyzeWithFile(
                "/api/geotech/analyze", 
                file.getBytes(), 
                file.getOriginalFilename()
            ).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "Geotechnical analysis completed"
            ));
            
        } catch (Exception e) {
            log.error("Geotechnical analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Analyze BOQ from file
     * POST /api/analyze/boq
     */
    @PostMapping("/boq")
    public ResponseEntity<Map<String, Object>> analyzeBoq(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        
        try {
            log.info("Analyzing BOQ - file: {}, description: {}", 
                file != null ? file.getOriginalFilename() : "none", 
                description != null ? "provided" : "none");
            
            String result;
            if (file != null) {
                // Analyze with file
                result = aiGatewayService.analyzeWithFile(
                    "/api/boq/analyze", 
                    file.getBytes(), 
                    file.getOriginalFilename()
                ).block();
            } else if (description != null) {
                // Analyze with description
                result = aiGatewayService.analyzeWithFormData(
                    "/api/boq/analyze",
                    Map.of("description", description)
                ).block();
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Either file or description is required"));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "BOQ analysis completed"
            ));
            
        } catch (Exception e) {
            log.error("BOQ analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Analyze structural loads with JSON data
     * POST /api/analyze/structural/json
     */
    @PostMapping("/structural/json")
    public ResponseEntity<Map<String, Object>> analyzeStructural(
            @RequestBody Map<String, Object> requestData) {
        
        try {
            log.info("Analyzing structural loads with parameters: {}", requestData.keySet());
            
            String result = aiGatewayService.analyzeWithJson(
                "/api/structural/calculate", 
                requestData
            ).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "Structural analysis completed"
            ));
            
        } catch (Exception e) {
            log.error("Structural analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Analyze site photo
     * POST /api/analyze/site-photo
     */
    @PostMapping("/site-photo")
    public ResponseEntity<Map<String, Object>> analyzeSitePhoto(
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("Analyzing site photo: {}", file.getOriginalFilename());
            
            String result = aiGatewayService.analyzeWithFile(
                "/api/site_photo/analyze", 
                file.getBytes(), 
                file.getOriginalFilename()
            ).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "Site photo analysis completed"
            ));
            
        } catch (Exception e) {
            log.error("Site photo analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Query IS Code database
     * POST /api/analyze/iscode/query
     */
    @PostMapping("/iscode/query")
    public ResponseEntity<Map<String, Object>> queryIsCode(
            @RequestBody Map<String, Object> requestData) {
        
        try {
            log.info("Querying IS Code database: {}", requestData.get("query"));
            
            String result = aiGatewayService.analyzeWithJson(
                "/api/iscode/query", 
                requestData
            ).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "IS Code query completed"
            ));
            
        } catch (Exception e) {
            log.error("IS Code query failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Analyze tender document
     * POST /api/analyze/tender
     */
    @PostMapping("/tender")
    public ResponseEntity<Map<String, Object>> analyzeTender(
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("Analyzing tender document: {}", file.getOriginalFilename());
            
            String result = aiGatewayService.analyzeWithFile(
                "/api/tender/analyze", 
                file.getBytes(), 
                file.getOriginalFilename()
            ).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "Tender analysis completed"
            ));
            
        } catch (Exception e) {
            log.error("Tender analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Legacy endpoints for backward compatibility
     */
    
    @PostMapping("/{module}")
    public ResponseEntity<Map<String, Object>> analyzeDocument(
            @PathVariable String module,
            @RequestBody Map<String, String> request) {
        
        UUID documentId = UUID.fromString(request.get("documentId"));
        analysisService.analyzeDocument(documentId, module);
        
        return ResponseEntity.accepted()
                .body(Map.of("message", "Analysis started", "documentId", documentId.toString()));
    }

    @PostMapping("/{module}/json")
    public ResponseEntity<Map<String, Object>> analyzeWithJson(
            @PathVariable String module,
            @RequestBody Map<String, Object> requestData) {
        
        UUID reportId = analysisService.analyzeWithJson(module, requestData);
        
        return ResponseEntity.accepted()
                .body(Map.of("message", "Analysis started", "reportId", reportId.toString()));
    }
    
    @PostMapping("/boq/description")
    public ResponseEntity<Map<String, Object>> analyzeBoqDescription(
            @RequestBody Map<String, String> request) {
        
        String description = request.get("description");
        if (description == null || description.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Description is required"));
        }
        
        UUID reportId = analysisService.analyzeBoqWithDescription(description);
        
        return ResponseEntity.accepted()
                .body(Map.of("message", "BOQ analysis started", "reportId", reportId.toString()));
    }
    
    @GetMapping("/iscode/search")
    public ResponseEntity<Map<String, Object>> searchIsCodes(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {
        
        Map<String, Object> result = analysisService.searchIsCodes(query, limit);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/iscode/codes")
    public ResponseEntity<Map<String, Object>> listAvailableCodes() {
        Map<String, Object> result = analysisService.listAvailableCodes();
        return ResponseEntity.ok(result);
    }
}
