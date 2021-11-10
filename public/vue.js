new Vue({
  el: '#app',
  data() {
    return {
      positionInfo: null,
      pgnHistory: [],
      oldHistory: [],
      fenHistory: [],
      currentFen: '',
      history: []
    };
  },
  template:
    `
    <div>
    <chessboard @onMove="showInfo" :fen ="currentFen"/>
    <div>
      <!-- {{this.positionInfo}} -->
      <div class="flex">
        <ol>
          <li v-for="(move,index) in this.history" :key="index">
            <button @click="loadFen(index+1)" v-if="index%2==0">{{(index)/2+1}} {{move}}</button>
          </li>
        </ol>
        <ol>
          <li v-for="(move,index) in this.history" :key="index">
            <button @click="loadFen(index+1)" v-if="index%2!=0">{{move}}</button>
          </li>
        </ol>
      </div>
    </div>
    </div>
    `,
  methods: {
    showInfo(data) {
      this.positionInfo = data
      this.pgnHistory = data.history
      this.history = this.oldHistory.concat(this.pgnHistory)
      this.fenHistory.push(data.fen)
      console.log(this.history);
    },
    loadFen(index) {
      this.currentFen = this.fenHistory[index]
      this.oldHistory = this.pgnHistory.slice(0, index)
      this.fenHistory.slice(0, index)
    },
  }
});