#!/bin/bash
# afk-ralph.sh — Fully automated Ralph loop
# Usage: ./afk-ralph.sh <iterations>

set -e
ITERATIONS=${1:-50}
echo "🚀 Starting Ralph with $ITERATIONS iterations..."

for ((i=1; i<=ITERATIONS; i++)); do
  echo "🔄 Iteration $i of $ITERATIONS"

  result=$(claude --permission-mode bypassPermissions -p "@plan.md @progress.md \
You are building this project based on the plan.md.

WORKFLOW:
1. Read the plan.md and progress.md carefully
2. Find the NEXT INCOMPLETE TASK (marked with [ ])
3. Implement that ONE task completely
4. Run checks: typecheck and lint
5. Commit and update BOTH files:
   - plan.md: Change [ ] to [x] for the completed task
   - progress.md: Add task number, timestamp, and notes
6. Append a dated progress entry to activity.md describing what you changed, which commands you ran, and what you verified in Chrome.
7. When the task is confirmed, update that task Status in plan.md from failing to passing.
8. Make one git commit for that task only with a clear single line message. Do not run git init, do not change git remotes, and do not push.
9. Repeat until all tasks are passing.
10. When all tasks are marked passing, output exactly COMPLETE.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "🎉 All tasks COMPLETE!"
    exit 0
  fi
done

echo "⏸️ Reached $ITERATIONS iterations. Run again to continue."