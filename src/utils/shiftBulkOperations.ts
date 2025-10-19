import { supabase } from "@/integrations/supabase/client";

export interface EditorShift {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  shift_type: 'day' | 'evening' | 'night' | 'off';
}

const shiftTimes = {
  day: { start: '06:00', end: '14:00' },
  evening: { start: '14:00', end: '22:00' },
  night: { start: '22:00', end: '06:00' },
};

/**
 * Convert editor shift to database shift format
 */
function editorShiftToDatabase(shift: EditorShift, userId: string) {
  if (shift.shift_type === 'off') {
    return null; // Don't save 'off' shifts
  }

  const times = shiftTimes[shift.shift_type];
  const startTime = `${shift.date}T${times.start}:00`;
  
  // Handle night shift end time (next day)
  let endDate = shift.date;
  if (shift.shift_type === 'night') {
    const date = new Date(shift.date);
    date.setDate(date.getDate() + 1);
    endDate = date.toISOString().split('T')[0];
  }
  const endTime = `${endDate}T${times.end}:00`;

  return {
    employee_id: shift.employee_id,
    start_time: startTime,
    end_time: endTime,
    shift_type: shift.shift_type,
    department: 'Akutmottagning', // Default department
    created_by: userId,
  };
}

/**
 * Bulk save edited shifts to database
 * 
 * Strategy:
 * 1. Identify which shifts are new (id starts with 'new_')
 * 2. Identify which existing shifts changed
 * 3. Identify which shifts were deleted (in original but not in modified)
 * 4. Insert new shifts
 * 5. Update changed shifts
 * 6. Delete removed shifts
 */
export async function bulkSaveShifts(
  originalShifts: EditorShift[],
  modifiedShifts: EditorShift[],
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Separate new vs existing shifts
    const newShifts = modifiedShifts.filter(s => s.id.startsWith('new_'));
    const existingShifts = modifiedShifts.filter(s => !s.id.startsWith('new_'));

    // 2. Find shifts that were deleted (in original but not in modified)
    const originalIds = new Set(originalShifts.map(s => s.id));
    const modifiedIds = new Set(existingShifts.map(s => s.id));
    const deletedIds = Array.from(originalIds).filter(id => !modifiedIds.has(id));

    // 3. Find shifts that changed
    const changedShifts = existingShifts.filter(modifiedShift => {
      const originalShift = originalShifts.find(s => s.id === modifiedShift.id);
      if (!originalShift) return false;
      
      return (
        originalShift.shift_type !== modifiedShift.shift_type ||
        originalShift.employee_id !== modifiedShift.employee_id ||
        originalShift.date !== modifiedShift.date
      );
    });

    console.log('Bulk save analysis:', {
      newShifts: newShifts.length,
      changedShifts: changedShifts.length,
      deletedShifts: deletedIds.length,
      totalModified: modifiedShifts.length
    });

    // 4. Insert new shifts (filter out 'off' shifts)
    if (newShifts.length > 0) {
      const insertsData = newShifts
        .map(shift => editorShiftToDatabase(shift, userId))
        .filter(Boolean); // Remove nulls (off shifts)

      if (insertsData.length > 0) {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(insertsData);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Insert failed: ${insertError.message}`);
        }
      }
    }

    // 5. Update changed shifts
    for (const changedShift of changedShifts) {
      if (changedShift.shift_type === 'off') {
        // If changed to 'off', delete the shift
        const { error: deleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('id', changedShift.id);

        if (deleteError) {
          console.error('Delete error (changed to off):', deleteError);
          throw new Error(`Delete failed: ${deleteError.message}`);
        }
      } else {
        // Update the shift
        const updateData = editorShiftToDatabase(changedShift, userId);
        if (updateData) {
          const { error: updateError } = await supabase
            .from('shifts')
            .update(updateData)
            .eq('id', changedShift.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw new Error(`Update failed: ${updateError.message}`);
          }
        }
      }
    }

    // 6. Delete removed shifts
    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .in('id', deletedIds);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }
    }

    console.log('✅ Bulk save completed successfully');
    return { success: true };

  } catch (error) {
    console.error('Bulk save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
