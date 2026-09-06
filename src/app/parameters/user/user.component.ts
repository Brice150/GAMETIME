import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
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
  readonly updateEvent = output<void>();

  update(): void {
    this.updateEvent.emit();
  }
}
