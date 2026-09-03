import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { Player } from '../../core/interfaces/player';

@Component({
  selector: 'app-user',
  imports: [CommonModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  readonly player = input.required<Player>();
  @Output() updateEvent = new EventEmitter<void>();

  update(): void {
    this.updateEvent.emit();
  }
}
