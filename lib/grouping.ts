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
      remainingStudents.forEach((student, index) => {
        if (index < groups.length) {
          groups[index].push(student);
        }
      });
    }
  }

  return {
    groups,
    remainingCount: remaining,
  };
}
