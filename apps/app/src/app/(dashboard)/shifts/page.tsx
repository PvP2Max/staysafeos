import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from "@staysafeos/ui";

export default async function ShiftsPage() {
  let shifts: Array<{
    id: string;
    title: string;
    description?: string;
    role: string;
    startTime: string;
    endTime: string;
    slotsNeeded: number;
    location?: string;
    signedUp?: boolean;
    slotsRemaining?: number;
    signups?: Array<{
      membership?: { account?: { name?: string } };
    }>;
  }> = [];

  try {
    const api = await createApiClient();
    shifts = await api.getShifts();
  } catch {
    // Use empty if API fails
  }

  // Group by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = new Date(shift.startTime).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, typeof shifts>);

  const sortedDates = Object.keys(shiftsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shifts</h1>
        <p className="text-muted-foreground mt-1">Sign up for volunteer shifts</p>
      </div>

      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p>No shifts available</p>
            <p className="text-sm mt-1">Check back later for upcoming shifts</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <h2 className="text-lg font-semibold mb-3">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <div className="space-y-3">
              {shiftsByDate[date].map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ShiftCard({
  shift,
}: {
  shift: {
    id: string;
    title: string;
    description?: string;
    role: string;
    startTime: string;
    endTime: string;
    slotsNeeded: number;
    location?: string;
    signedUp?: boolean;
    slotsRemaining?: number;
    signups?: Array<{
      membership?: { account?: { name?: string } };
    }>;
  };
}) {
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const slotsRemaining = shift.slotsRemaining ?? shift.slotsNeeded - (shift.signups?.length ?? 0);
  const isFull = slotsRemaining <= 0;

  const roleColors: Record<string, string> = {
    DRIVER: "bg-yellow-100 text-yellow-800",
    TC: "bg-green-100 text-green-800",
    DISPATCHER: "bg-blue-100 text-blue-800",
    SAFETY: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className={shift.signedUp ? "border-primary bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{shift.title}</CardTitle>
              <Badge className={roleColors[shift.role] || "bg-gray-100"}>{shift.role}</Badge>
            </div>
            {shift.description && (
              <CardDescription className="mt-1">{shift.description}</CardDescription>
            )}
          </div>
          {shift.signedUp && (
            <Badge className="bg-primary text-primary-foreground">Signed Up</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <p>
              {startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
              {endTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
            {shift.location && (
              <p className="text-muted-foreground">{shift.location}</p>
            )}
            <p className="text-muted-foreground">
              {slotsRemaining} of {shift.slotsNeeded} spots available
            </p>
          </div>
          <ShiftActionButton shift={shift} isFull={isFull} />
        </div>

        {/* Show who's signed up */}
        {shift.signups && shift.signups.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Signed up:</p>
            <div className="flex flex-wrap gap-2">
              {shift.signups.map((signup, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                  {signup.membership?.account?.name || "Unknown"}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShiftActionButton({
  shift,
  isFull,
}: {
  shift: { id: string; signedUp?: boolean };
  isFull: boolean;
}) {
  // This would need to be a client component for interactivity
  // For now, showing static buttons
  if (shift.signedUp) {
    return (
      <Button variant="outline" size="sm">
        Cancel
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button variant="outline" size="sm" disabled>
        Full
      </Button>
    );
  }

  return <Button size="sm">Sign Up</Button>;
}
