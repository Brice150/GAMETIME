import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getEntreprise } from '../../assets/data/entreprise';
import { LegalFooterComponent } from '../shared/components/legal-footer/legal-footer.component';
import { CguComponent } from './cgu/cgu.component';
import { CookiesComponent } from './cookies/cookies.component';
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATE } from './legal-documents';
import { MentionsLegalesComponent } from './mentions-legales/mentions-legales.component';
import { PrivacyComponent } from './privacy/privacy.component';

@Component({
  selector: 'app-infos',
  imports: [
    RouterLink,
    CguComponent,
    CookiesComponent,
    MentionsLegalesComponent,
    PrivacyComponent,
    LegalFooterComponent,
  ],
  templateUrl: './infos.component.html',
  styleUrl: './infos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfosComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private previousTitle = '';

  readonly enterprise = getEntreprise();
  readonly lastUpdate = LEGAL_LAST_UPDATE;
  readonly infoType = signal(LEGAL_DOCUMENTS[0].key);

  // Une adresse inconnue affiche les mentions legales plutot qu'une page
  // vide.
  readonly current = computed(
    () =>
      LEGAL_DOCUMENTS.find((document) => document.key === this.infoType()) ??
      LEGAL_DOCUMENTS[0],
  );

  readonly others = computed(() =>
    LEGAL_DOCUMENTS.filter((document) => document !== this.current()),
  );

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.infoType.set(params.get('infoType') ?? '');
        this.title.setTitle(`${this.current().title} | Game Time`);
      });
  }

  // Les autres pages ne declarent pas de titre : sans cela, le dernier
  // document consulte resterait dans l'onglet.
  ngOnDestroy(): void {
    this.title.setTitle(this.previousTitle);
  }
}
