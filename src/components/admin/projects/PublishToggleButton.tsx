"use client";

import { togglePublishProjectAction } from "@/lib/projects/actions";
import styles from "./ProjectsList.module.scss";

type PublishToggleButtonProps = {
  id: string;
  isPublished: boolean;
};

export default function PublishToggleButton({
  id,
  isPublished,
}: PublishToggleButtonProps) {
  return (
    <form action={togglePublishProjectAction}>
      <input type="hidden" name="id" value={id} />
      <input
        type="hidden"
        name="isPublished"
        value={isPublished ? "false" : "true"}
      />
      <button type="submit" className={styles.actionButton}>
        {isPublished ? "הסר פרסום" : "פרסם"}
      </button>
    </form>
  );
}
