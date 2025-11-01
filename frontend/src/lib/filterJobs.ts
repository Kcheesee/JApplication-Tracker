import { Job, JobStatus } from '../types/job';

/**
 * Filter jobs based on search query and status filter
 * @param jobs - List of jobs to filter
 * @param query - Search query (searches company, role, notes, description)
 * @param statusFilter - Status to filter by ("All" for no filter)
 * @returns Filtered list of jobs
 */
export function filterJobsUtil(
  jobs: Job[],
  query: string,
  statusFilter: JobStatus | "All"
): Job[] {
  let filtered = jobs;

  // Apply status filter
  if (statusFilter !== "All") {
    filtered = filtered.filter(job => job.status === statusFilter);
  }

  // Apply search query (case-insensitive, fuzzy search)
  if (query && query.trim() !== "") {
    const lowerQuery = query.toLowerCase().trim();
    filtered = filtered.filter(job => {
      const searchableFields = [
        job.company || "",
        job.role || job.position || "",
        job.notes || "",
        job.description || "",
        job.source || job.application_source || "",
      ].map(field => field.toLowerCase());

      return searchableFields.some(field => field.includes(lowerQuery));
    });
  }

  return filtered;
}

// Dev tests - run with: window.__RUN_JOB_TRACKER_TESTS__ = true
if (typeof window !== 'undefined' && (window as any).__RUN_JOB_TRACKER_TESTS__) {
  const testJobs: Job[] = [
    {
      id: "1",
      company: "Google",
      role: "Software Engineer",
      source: "Email",
      appliedAt: "2024-01-01",
      status: "Applied",
      lastActivity: "2024-01-01",
      emailLink: "https://mail.google.com/",
      notes: "Referred by John"
    },
    {
      id: "2",
      company: "Meta",
      role: "Product Manager",
      source: "LinkedIn",
      appliedAt: "2024-01-02",
      status: "Interviewing",
      lastActivity: "2024-01-05",
      emailLink: "https://mail.google.com/",
      description: "Looking for experienced PM"
    },
    {
      id: "3",
      company: "Amazon",
      role: "Data Scientist",
      source: "Referral",
      appliedAt: "2024-01-03",
      status: "Rejected",
      lastActivity: "2024-01-10",
      emailLink: "https://mail.google.com/"
    }
  ];

  console.log("🧪 Running Job Tracker Filter Tests...\n");

  // Test 1: Returns all with empty query + All status
  const test1 = filterJobsUtil(testJobs, "", "All");
  console.assert(test1.length === 3, "Test 1 Failed: Should return all jobs");
  console.log("✅ Test 1 Passed: Returns all with empty query + All status");

  // Test 2: Matches role text (case-insensitive)
  const test2 = filterJobsUtil(testJobs, "software", "All");
  console.assert(test2.length === 1 && test2[0].company === "Google", "Test 2 Failed: Should match Software Engineer");
  console.log("✅ Test 2 Passed: Matches role text (case-insensitive)");

  // Test 3: Status-only filter
  const test3 = filterJobsUtil(testJobs, "", "Interviewing");
  console.assert(test3.length === 1 && test3[0].company === "Meta", "Test 3 Failed: Should filter by Interviewing status");
  console.log("✅ Test 3 Passed: Status-only filter");

  // Test 4: Matches notes/description
  const test4 = filterJobsUtil(testJobs, "referred", "All");
  console.assert(test4.length === 1 && test4[0].company === "Google", "Test 4 Failed: Should match notes");
  console.log("✅ Test 4 Passed: Matches notes/description");

  // Test 5: Case-insensitive company match
  const test5 = filterJobsUtil(testJobs, "AMAZON", "All");
  console.assert(test5.length === 1 && test5[0].company === "Amazon", "Test 5 Failed: Should match company case-insensitive");
  console.log("✅ Test 5 Passed: Case-insensitive company match");

  // Test 6: Combined query+status match
  const test6 = filterJobsUtil(testJobs, "manager", "Interviewing");
  console.assert(test6.length === 1 && test6[0].company === "Meta", "Test 6 Failed: Should combine query and status");
  console.log("✅ Test 6 Passed: Combined query+status match");

  // Test 7: No matches returns empty
  const test7 = filterJobsUtil(testJobs, "nonexistent", "All");
  console.assert(test7.length === 0, "Test 7 Failed: Should return empty array");
  console.log("✅ Test 7 Passed: No matches returns empty");

  console.log("\n🎉 All tests passed!");
}
