package com.blueline.express.service;

import java.util.List;
import java.util.Map;

/**
 * OOP Interface for administrative reporting operations.
 */
public interface ReportOperations {
    Map<String, List<Map<String, Object>>> buildAllReports();
    String exportCsv(String reportType);
}
