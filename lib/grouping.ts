export type GroupingStrategy = 'allow-smaller' | 'distribute';

export interface GroupingOptions {
  groupSize: number;
  strategy: GroupingStrategy;
}

export interface GroupingResult {
  groups: string[][];
  remainingCount: number;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate groups from students list
 */
export function generateGroups(
  students: string[],
  options: GroupingOptions
): GroupingResult {
  if (students.length === 0) {
    return { groups: [], remainingCount: 0 };
  }

  const shuffled = shuffleArray(students);
  const groupSize = options.groupSize;
  const totalStudents = shuffled.length;
  const numFullGroups = Math.floor(totalStudents / groupSize);
  const remaining = totalStudents % groupSize;

  const groups: string[][] = [];

  // Create full groups
  for (let i = 0; i < numFullGroups; i++) {
    const start = i * groupSize;
    const end = start + groupSize;
    groups.push(shuffled.slice(start, end));
  }

  // Handle remaining students
  if (remaining > 0) {
    if (options.strategy === 'allow-smaller') {
      // Create a smaller final group
      groups.push(shuffled.slice(numFullGroups * groupSize));
    } else if (options.strategy === 'distribute') {
      // Distribute remaining students across existing groups
      const remainingStudents = shuffled.slice(numFullGroups * groupSize);
      if (groups.length === 0) {
        // No full group formed (groupSize >= total students) — nothing to
        // distribute into, so these students become their own group.
        groups.push(remainingStudents);
      } else {
        // Cycle through groups rather than only the first `remaining` of
        // them — remaining can exceed groups.length (e.g. 15 students,
        // groupSize 10: 1 full group, 5 left over), which silently dropped
        // the overflow when this only ever wrote to groups[index].
        remainingStudents.forEach((student, index) => {
          groups[index % groups.length].push(student);
        });
      }
    }
  }

  return {
    groups,
    remainingCount: remaining,
  };
}
