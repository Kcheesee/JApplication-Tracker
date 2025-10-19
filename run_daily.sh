#!/bin/bash
# Daily Job Tracker Runner
# This script runs the job tracker and logs the output

cd "$(dirname "$0")"
python3 job_tracker.py >> tracker.log 2>&1
