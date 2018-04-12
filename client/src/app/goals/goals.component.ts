import {Component, OnInit} from '@angular/core';
import {GoalsService} from './goals.service';
import {Goal} from './goal';
import {Observable} from 'rxjs/Observable';
import {MatDialog} from '@angular/material';
import {AddGoalComponent} from './add-goal.component';
import {MatSnackBar} from '@angular/material';

@Component({
    selector: 'app-goals-component',
    templateUrl: 'goals.component.html',
    styleUrls: ['./goals.component.css'],
})

export class GoalsComponent implements OnInit {
    // These are public so that tests can reference them (.spec.ts)
    public goals: Goal[] = [];
    public todayGoals: Goal[] = [];
    public shownGoals: Goal[] = [];
    public filteredGoals: Goal[] = [];

    // These are the target values used in searching.
    public goalPurpose: string;
    public goalCategory: string;
    public goalName: string;
    public goalStatus: string;
    public goalStart;
    public goalEnd;
    public goalNext;
    public goalFrequency;
    public today;
    public showAllGoals = false;
    public goalsPerPage = 4;
    public currentPage = 1;

    // The ID of the goal
    private highlightedID: { '$oid': string } = {'$oid': ''};

    // Inject the GoalsService into this component.
    constructor(public goalService: GoalsService, public dialog: MatDialog, public snackBar: MatSnackBar) {

    }

    isHighlighted(goal: Goal): boolean {
        return goal._id['$oid'] === this.highlightedID['$oid'];
    }


    openDialog(): void {
        const newGoal: Goal = {
            _id: '',
            userID: localStorage.getItem("userID"),
            name: '',
            category: '',
            purpose: '',
            status: false,
            start: this.goalStart,
            end: '',
            next: this.goalNext,
            frequency: ''
        };
        const dialogRef = this.dialog.open(AddGoalComponent, {
            width: '300px',
            data: {goal: newGoal}
        });

        dialogRef.afterClosed().subscribe(result => {
            this.goalService.addNewGoal(result).subscribe(
                addGoalResult => {
                    this.highlightedID = addGoalResult;
                    this.refreshGoals();
                },
                err => {
                    // This should probably be turned into some sort of meaningful response.
                    console.log('There was an error adding the goal.');
                    console.log('The error was ' + JSON.stringify(err));
                });
        });
    }

    deleteGoal(_id: string) {
        this.goalService.deleteGoal(_id).subscribe(
            goals => {
                this.refreshGoals();
                this.loadService();
            },
            err => {
                console.log(err);
                this.refreshGoals();
                this.loadService();
            }
        );
    }

    editGoal(_id, name, purpose, category, status, frequency, start, end, next) {
        const updatedGoal: Goal = {
            _id: _id,
            userID: localStorage.getItem("userID"),
            purpose: purpose,
            category: category,
            name: name,
            status: status,
            frequency: frequency,
            start: start,
            end: end,
            next: next
        };
        this.goalService.completeGoal(updatedGoal).subscribe(
            completeGoalResult => {
                this.highlightedID = completeGoalResult;
                this.refreshGoals();
            },
            err => {
                console.log('There was an error completing the goal.');
                console.log('The error was ' + JSON.stringify(err));
            });
    }

    updateNext(_id, name, purpose, category, status, frequency, start, end, next) {
        const updatedGoal: Goal = {
            _id: _id,
            userID: localStorage.getItem("userID"),
            purpose: purpose,
            category: category,
            name: name,
            status: status,
            frequency: frequency,
            start: start,
            end: end,
            next: next
        };
        this.goalService.completeGoal(updatedGoal).subscribe(
            completeGoalResult => {
                this.highlightedID = completeGoalResult;
                //this.refreshGoals();
            },
            err => {
                console.log('There was an error completing the goal.');
                console.log('The error was ' + JSON.stringify(err));
            });
    }


    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 2000,
        });
    }

    public filterGoals(searchPurpose: string, searchCategory: string,
                       searchName: string, searchStatus: string,
                       searchFrequency: string): Goal[] {

        this.filteredGoals = this.goals;

        // Filter by purpose
        if (searchPurpose != null) {
            searchPurpose = searchPurpose.toLocaleLowerCase();

            this.filteredGoals = this.filteredGoals.filter(goal => {
                return !searchPurpose || goal.purpose.toLowerCase().indexOf(searchPurpose) !== -1;
            });
        }

        // Filter by category
        if (searchCategory != null) {
            searchCategory = searchCategory.toLocaleLowerCase();

            this.filteredGoals = this.filteredGoals.filter(goal => {
                return !searchCategory || goal.category.toLowerCase().indexOf(searchCategory) !== -1;
            });
        }

        // Filter by name
        if (searchName != null) {
            searchName = searchName.toLocaleLowerCase();

            this.filteredGoals = this.filteredGoals.filter(goal => {
                return !searchName || goal.name.toLowerCase().indexOf(searchName) !== -1;
            });
        }

        // Filter by status
        if (searchStatus != null) {
            searchStatus = searchStatus.toLocaleLowerCase();

            this.filteredGoals = this.filteredGoals.filter(goal => {
                return !searchStatus || goal.name.toLowerCase().indexOf(searchStatus) !== -1;
            });
        }

        this.showGoals("all")
        return this.filteredGoals;
    }

    getNext(){

        if(this.showAllGoals == false) {
            this.todayGoals = this.filteredGoals.filter(goal => {

                var nextGoal = new Date(goal.next);
                nextGoal.setHours(0, 0, 0, 0);

                var endGoal = new Date(goal.end);
                endGoal.setHours(0, 0, 0, 0);

                var day = nextGoal.getDate();
                var month = nextGoal.getMonth();

                if(nextGoal.getTime() < this.today.getTime()
                && goal.frequency != "Does not repeat"
                && goal.status == true
                && endGoal.getTime() >= this.today.getTime()){
                    this.updateNext(goal._id, goal.name, goal.purpose, goal.category, false, goal.frequency, goal.start, goal.end, goal.next)
                }

                if (goal.status == true) {
                    return false;
                }

                if(endGoal.getTime() < this.today.getTime()){
                    return false;
                }

                if (goal.frequency == 'Does not repeat') {
                    if (nextGoal.getTime() == this.today.getTime()) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                while (nextGoal.getTime() < this.today.getTime()) {
                    if (goal.frequency == "Daily") {
                        day = day + 1;
                        nextGoal.setDate(day);
                    }

                    if (goal.frequency == "Weekly") {
                        day = day + 7;
                        nextGoal.setDate(day);
                    }

                    if (goal.frequency == "Monthly") {
                        month = month + 1;
                        nextGoal.setMonth(month);
                    }
                }

                if (nextGoal.getTime() == this.today.getTime()){
                    this.updateNext(goal._id, goal.name, goal.purpose, goal.category, goal.status, goal.frequency, goal.start, goal.end, nextGoal.toString());
                    return true;
                }

                else {
                    return false;
                }


            });

            this.showGoals("today");
        }

        else{
            this.showGoals("all");
        }
        return this.todayGoals;

    }

    showGoals(type){
        var count = this.currentPage * this.goalsPerPage;

        if(type == "today") {
            console.log("today");

            this.shownGoals = this.todayGoals.filter(goal => {
                if (count > this.goalsPerPage) {
                    count--;
                    return false;
                }

                if (count <= this.goalsPerPage && count != 0) {
                    count--;
                    return true;
                }

            });
        }

        else{
            console.log("all");
            this.shownGoals = this.filteredGoals.filter(goal => {
                if (count > this.goalsPerPage) {
                    count--;
                    return false;
                }

                if (count <= this.goalsPerPage && count != 0) {
                    count--;
                    return true;
                }

            });
        }
    }

    maxNumPages(type): boolean{
        if(type == "today") {
            return (this.goalsPerPage * this.currentPage) < this.todayGoals.length;
        }
        else{
            return (this.goalsPerPage * this.currentPage) < this.filteredGoals.length;
        }
    }


    /**
     * Starts an asynchronous operation to update the goals list
     *
     */
    refreshGoals(): Observable<Goal[]> {
        // Get Goals returns an Observable, basically a "promise" that
        // we will get the data from the server.
        //
        // Subscribe waits until the data is fully downloaded, then
        // performs an action on it (the first lambda)

        const goalObservable: Observable<Goal[]> = this.goalService.getGoals(localStorage.getItem("userID"));
        goalObservable.subscribe(
            goals => {
                this.goals = goals;
                this.filterGoals(this.goalPurpose, this.goalCategory, this.goalName, this.goalStatus, this.goalFrequency);
                this.getNext();
                },
            err => {
                console.log(err);
            });


        return goalObservable;
    }


    loadService(): void {
        console.log(localStorage.getItem("userID"));
        this.goalService.getGoals(localStorage.getItem("userID"),this.goalCategory).subscribe(
            goals => {
                this.goals = goals;
                this.filteredGoals = this.goals;
            },
            err => {
                console.log(err);
            }
        );


    }

    ngOnInit(): void {
        localStorage.setItem("userID", "4cb56a89541a2d783595012c");
        this.refreshGoals();
        this.loadService();
        this.getDate();
    }

    getDate() {
        this.today = new Date();
        this.goalStart = this.today;
        this.goalNext = this.today;
        this.today.setHours(0, 0, 0, 0);


    }
}
