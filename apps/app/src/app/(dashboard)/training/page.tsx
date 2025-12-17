import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from "@staysafeos/ui";
import Link from "next/link";

export default async function TrainingPage() {
  let modules: Array<{
    id: string;
    title: string;
    description?: string;
    category: string;
    videoDuration?: number;
    requiredRoles: string[];
    sortOrder: number;
  }> = [];

  let progress: Array<{
    moduleId: string;
    videoWatched: boolean;
    quizPassed: boolean;
    quizScore?: number;
    completedAt?: string;
  }> = [];

  try {
    const api = await createApiClient();
    const [modulesResult, progressResult] = await Promise.all([
      api.getTrainingModules(),
      api.getMyProgress(),
    ]);
    modules = modulesResult;
    progress = progressResult;
  } catch {
    // Use empty if API fails
  }

  const progressMap = new Map(progress.map((p) => [p.moduleId, p]));

  const categories = ["ORIENTATION", "SAFETY", "DRIVER", "TC", "DISPATCHER"];
  const modulesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = modules.filter((m) => m.category === cat).sort((a, b) => a.sortOrder - b.sortOrder);
    return acc;
  }, {} as Record<string, typeof modules>);

  const completedCount = progress.filter((p) => p.quizPassed).length;
  const totalCount = modules.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training</h1>
        <p className="text-muted-foreground mt-1">Complete required training modules</p>
      </div>

      {/* Progress Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} modules completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modules by Category */}
      {categories.map((category) => {
        const categoryModules = modulesByCategory[category];
        if (categoryModules.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryModules.map((module) => {
                const moduleProgress = progressMap.get(module.id);
                const isCompleted = moduleProgress?.quizPassed;
                const inProgress = moduleProgress?.videoWatched && !moduleProgress?.quizPassed;

                return (
                  <Card key={module.id} className={isCompleted ? "border-green-200 bg-green-50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{module.title}</CardTitle>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                        {inProgress && (
                          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                        )}
                      </div>
                      {module.description && (
                        <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {module.videoDuration
                            ? `${Math.floor(module.videoDuration / 60)}m ${module.videoDuration % 60}s`
                            : ""}
                        </div>
                        <Link href={`/training/${module.id}`}>
                          <Button variant={isCompleted ? "outline" : "default"} size="sm">
                            {isCompleted ? "Review" : inProgress ? "Continue" : "Start"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {modules.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p>No training modules available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
